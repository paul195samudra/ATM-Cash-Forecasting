"""Read-side queries used by the API. Field names for status rows match the dashboard's `atmData`."""
from __future__ import annotations

import numpy as np
import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Atm, AtmStatus, ModelRun, Prediction, Withdrawal
from . import cash

STATUS_ORDER = {"Refill Now": 0, "Refill Soon": 1, "OK": 2, "No Data": 3}


def latest_snapshot_date(db: Session):
    return db.scalar(select(func.max(AtmStatus.snapshot_date)))


def status_frame(db: Session, snapshot=None) -> pd.DataFrame:
    snap = snapshot or latest_snapshot_date(db)
    if snap is None:
        return pd.DataFrame()
    q = (select(AtmStatus, Atm.location).join(Atm, Atm.atm_id == AtmStatus.atm_id)
         .where(AtmStatus.snapshot_date == snap))
    rows = []
    for st, loc in db.execute(q):
        rows.append({
            "ATMID": st.atm_id, "Location": loc or f"ATM {st.atm_id}", "ATM_Capacity": st.capacity,
            "Estimated_Cash_Remaining": st.cash_remaining, "Cash_Remaining_Pct": st.cash_remaining_pct,
            "Predicted_Demand": st.predicted_demand, "Days_of_Cash": st.days_of_cash,
            "Refill_Suggestion_Amount": st.refill_suggestion, "Recommended_Loading": st.recommended_loading,
            "Status": st.status, "Stockout_Risk": bool(st.stockout_risk), "Balance_Source": st.balance_source,
            "Forecast_Method": st.forecast_method,
            "Last_Data_Date": st.last_data_date.isoformat() if st.last_data_date else None,
        })
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df["_o"] = df["Status"].map(STATUS_ORDER).fillna(9)
    df = df.sort_values(["_o", "Days_of_Cash", "Cash_Remaining_Pct"], na_position="last").drop(columns="_o")
    return df.reset_index(drop=True)


def _records(df: pd.DataFrame) -> list[dict]:
    return df.astype(object).where(df.notna(), None).to_dict("records")


def dashboard_payload(db: Session) -> dict:
    snap = latest_snapshot_date(db)
    df = status_frame(db, snap)
    return {"as_of": snap.isoformat() if snap else None, "kpis": cash.kpis(df) if len(df) else {},
            "atms": _records(df) if len(df) else []}


def list_atms(db: Session, *, q=None, status=None, max_days=None, min_days=None, max_pct=None, min_pct=None,
              sort="Days_of_Cash", order="asc", limit=500, offset=0) -> dict:
    df = status_frame(db)
    if df.empty:
        return {"total": 0, "items": []}
    if q:
        ql = q.lower()
        df = df[df["ATMID"].str.lower().str.contains(ql, regex=False) | df["Location"].str.lower().str.contains(ql, regex=False)]
    if status:
        df = df[df["Status"].isin(status)]
    if max_days is not None:
        df = df[df["Days_of_Cash"] < max_days]
    if min_days is not None:
        df = df[df["Days_of_Cash"] >= min_days]
    if max_pct is not None:
        df = df[df["Cash_Remaining_Pct"] <= max_pct]
    if min_pct is not None:
        df = df[df["Cash_Remaining_Pct"] > min_pct]
    if sort in df.columns:
        if sort == "Status":
            df = df.assign(_o=df["Status"].map(STATUS_ORDER)).sort_values("_o", ascending=order == "asc").drop(columns="_o")
        else:
            df = df.sort_values(sort, ascending=order == "asc", na_position="last")
    total = len(df)
    return {"total": total, "items": _records(df.iloc[offset: offset + limit])}


def get_atm(db: Session, atm_id: str) -> dict | None:
    df = status_frame(db)
    row = df[df["ATMID"] == atm_id] if len(df) else df
    atm = db.get(Atm, atm_id)
    if atm is None:
        return None
    out = _records(row)[0] if len(row) else {"ATMID": atm_id, "Location": atm.location or f"ATM {atm_id}", "Status": "No Data"}
    out["Capacity_Source"] = atm.capacity_source
    n, first, last = db.execute(select(func.count(), func.min(Withdrawal.date), func.max(Withdrawal.date))
                                .where(Withdrawal.atm_id == atm_id)).one()
    out["history_days"], out["history_first"], out["history_last"] = n, first and first.isoformat(), last and last.isoformat()
    return out


def history(db: Session, atm_id: str, start=None, end=None) -> dict:
    q = select(Prediction).where(Prediction.atm_id == atm_id).order_by(Prediction.target_date)
    if start:
        q = q.where(Prediction.target_date >= start)
    if end:
        q = q.where(Prediction.target_date <= end)
    rows = list(db.scalars(q))
    return {
        "atm_id": atm_id,
        "dates": [r.target_date.isoformat() for r in rows],        # the day the demand actually occurs
        "as_of": [r.as_of_date.isoformat() for r in rows],
        "actual": [None if r.actual is None else round(r.actual) for r in rows],
        "predicted": [round(r.predicted) for r in rows],
        "split": [r.split for r in rows],
    }


def refill_plan(db: Session, statuses=("Refill Now", "Refill Soon"), limit=1000) -> dict:
    df = status_frame(db)
    if df.empty:
        return {"as_of": None, "count": 0, "total_amount": 0, "items": []}
    df = df[df["Status"].isin(statuses)].copy()
    df["Priority"] = np.arange(1, len(df) + 1)
    df = df.head(limit)
    return {"as_of": latest_snapshot_date(db).isoformat(), "count": len(df),
            "total_amount": float(df["Refill_Suggestion_Amount"].fillna(0).sum()), "items": _records(df)}


def monitoring(db: Session) -> dict:
    """Live accuracy: only forecasts we ISSUED and have since been proven right/wrong (split = Live)."""
    df = pd.read_sql(select(Prediction.target_date, Prediction.predicted, Prediction.actual, Prediction.split)
                     .where(Prediction.split == "Live", Prediction.actual.is_not(None)), db.get_bind())
    if df.empty:
        return {"live_rows": 0, "message": "No live (post-training) forecasts have been scored yet.", "weekly": []}
    df["err"] = df["predicted"] - df["actual"]
    df["week"] = pd.to_datetime(df["target_date"]).dt.to_period("W").dt.start_time.dt.date.astype(str)
    wk = df.groupby("week").agg(n=("err", "size"), MAE=("err", lambda x: x.abs().mean()),
                                RMSE=("err", lambda x: float(np.sqrt((x ** 2).mean()))), bias=("err", "mean")).reset_index()
    return {"live_rows": int(len(df)), "MAE": float(df["err"].abs().mean()),
            "RMSE": float(np.sqrt((df["err"] ** 2).mean())), "bias": float(df["err"].mean()),
            "weekly": wk.round(1).to_dict("records")}


def data_quality(db: Session) -> dict:
    s = get_settings()
    w = pd.read_sql(select(Withdrawal.atm_id, Withdrawal.date).where(Withdrawal.daily_withdrawal.is_not(None)), db.get_bind())
    if w.empty:
        return {"rows": 0}
    w["date"] = pd.to_datetime(w["date"])
    newest = w["date"].max()
    per = w.groupby("atm_id")["date"].agg(first="min", last="max", days="count")
    per["span"] = (per["last"] - per["first"]).dt.days + 1
    per["missing_days_inside_span"] = per["span"] - per["days"]
    stale = per[(newest - per["last"]).dt.days > s.stale_after_days]
    short = per[(per["days"] < 35) & ~per.index.isin(stale.index)]
    allw = pd.date_range(w["date"].min(), newest, freq="D")
    covered = set(w["date"].unique())
    holes = [d for d in allw if d not in covered]
    ranges = []
    for d in holes:
        if ranges and (d - ranges[-1][1]).days == 1:
            ranges[-1][1] = d
        else:
            ranges.append([d, d])
    return {
        "date_min": str(w["date"].min().date()), "date_max": str(newest.date()), "atms": int(len(per)),
        "network_gaps": [{"from": str(a.date()), "to": str(b.date()), "days": (b - a).days + 1} for a, b in ranges],
        "stale_atms": [{"atm_id": i, "last_data": str(r["last"].date())} for i, r in stale.iterrows()],
        "short_history_atms": [{"atm_id": i, "days": int(r["days"])} for i, r in short.iterrows()],
        "atms_with_internal_gaps": int((per["missing_days_inside_span"] > 0).sum()),
    }

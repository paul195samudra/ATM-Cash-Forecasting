"""Cash position, status and refill logic.

Priority for "how much cash is in the ATM right now?":
  1. REPORTED   - the latest operations event (refill / balance reading) minus the real
                  withdrawals since. This is ground truth and is what you should feed in.
  2. SIMULATED  - no events at all: replay actual withdrawals from a full vault, with a
                  refill triggered at the reorder threshold and executed after
                  SIM_REFILL_LEAD_DAYS (default 1).

What changed vs the notebook's simulation (cell 93)
  * It drew the balance down with *predicted* demand even for days whose real demand is
    known. We use actual withdrawals; the model is only used for tomorrow.
  * It reset the balance to capacity the moment it crossed the reorder line and only THEN
    computed status. An ATM that crossed 20% today therefore showed as 100% / "OK" (92 of
    your 256 ATMs sit at exactly 100%). Here the status is read BEFORE the refill happens.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from ..config import Settings

MAX_IMPUTE_GAP_DAYS = 7     # a hole longer than this restarts the simulation (balance unknowable)


@dataclass
class SimResult:
    balance: float
    refills: int
    refill_pending: bool


def simulate_balance(withdrawals: np.ndarray, capacity: float, reorder_pct: float, lead_days: int) -> SimResult:
    """Replay daily withdrawals. Day i: execute a due refill (start of day) -> deduct -> check threshold."""
    reorder = capacity * reorder_pct / 100.0
    bal, refills, due = float(capacity), 0, None
    for i, x in enumerate(withdrawals):
        if due is not None and i >= due:
            bal, due, refills = float(capacity), None, refills + 1
        bal = max(bal - float(x), 0.0)
        if bal <= reorder and due is None:
            if lead_days <= 0:               # instant refill == the notebook's behaviour
                bal, refills = float(capacity), refills + 1
            else:
                due = i + lead_days
    return SimResult(bal, refills, due is not None)


def _round_up(x, unit: int):
    return np.ceil(np.asarray(x, float) / unit) * unit


def recommended_loading(pred: pd.Series | np.ndarray, s: Settings):
    """Notebook's loading policy: forecast x safety factor, capped, rounded UP to the cash unit."""
    return _round_up(np.clip(np.asarray(pred, float) * s.safety_factor, 0, s.atm_max_loading), s.cash_unit)


def status_from_pct(pct: float, s: Settings) -> str:
    if pct <= s.reorder_threshold_pct:
        return "Refill Now"
    if pct <= s.medium_threshold_pct:
        return "Refill Soon"
    return "OK"


def derive_capacities(loading_history: pd.Series, s: Settings) -> pd.Series:
    """Notebook rule: vault = CAPACITY_BUFFER x the ATM's peak recommended loading."""
    return loading_history * s.capacity_buffer


def _segment_calendar(series: pd.Series) -> pd.Series:
    """Latest run of dates where no hole exceeds MAX_IMPUTE_GAP_DAYS, re-indexed to a daily
    calendar with small holes imputed by the ATM's typical (median) daily demand."""
    series = series.dropna().sort_index()
    gaps = series.index.to_series().diff().dt.days.fillna(1)
    breaks = gaps[gaps > MAX_IMPUTE_GAP_DAYS]
    if len(breaks):
        series = series.loc[breaks.index[-1]:]
    cal = pd.date_range(series.index.min(), series.index.max(), freq="D")
    typical = float(series.tail(28).median()) if len(series) else 0.0
    return series.reindex(cal).fillna(typical)


def compute_status(
    withdrawals: pd.DataFrame,          # ATMID, Date, Daily_Withdrawal
    forecasts: pd.DataFrame,            # ATMID, predicted, method   (live next-day forecast, one row per ATM)
    loading_history: pd.Series,         # ATMID -> max Recommended_Loading ever predicted
    master: pd.DataFrame,               # ATMID, Location, Capacity (Capacity may be NaN)
    events: pd.DataFrame,               # atm_id, event_date, event_type, balance_after
    s: Settings,
    known_atms: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.Timestamp]:
    """Return (status_table, as_of_date). One row per ATM, including 'No Data' ATMs."""
    w = withdrawals.dropna(subset=["Daily_Withdrawal"])
    as_of = pd.Timestamp(w["Date"].max())
    series_by_atm = {a: g.set_index("Date")["Daily_Withdrawal"] for a, g in w.groupby("ATMID")}
    fc = forecasts.set_index("ATMID") if len(forecasts) else pd.DataFrame(columns=["predicted", "method"])
    mast = master.set_index("ATMID") if len(master) else pd.DataFrame(columns=["Location", "Capacity"])
    derived = derive_capacities(loading_history, s)
    ev = events.copy()
    if len(ev):
        ev["event_date"] = pd.to_datetime(ev["event_date"])
        ev = ev.sort_values(["event_date", "id"] if "id" in ev.columns else ["event_date"])
    ev_by_atm = {a: g for a, g in ev.groupby("atm_id")} if len(ev) else {}

    atm_ids = sorted(set(known_atms or []) | set(series_by_atm))
    rows = []
    for atm in atm_ids:
        ser = series_by_atm.get(atm)
        loc = mast["Location"].get(atm) if "Location" in mast else None
        base = {"ATMID": atm, "Location": loc if isinstance(loc, str) and loc else f"ATM {atm}"}
        if ser is None or ser.empty:
            rows.append({**base, "Status": "No Data", "Last_Data_Date": None})
            continue
        last = pd.Timestamp(ser.index.max())
        if (as_of - last).days > s.stale_after_days:
            cap = mast["Capacity"].get(atm) if "Capacity" in mast else np.nan
            rows.append({**base, "ATM_Capacity": None if pd.isna(cap) else float(cap), "Status": "No Data",
                         "Last_Data_Date": last.date()})
            continue

        cap = mast["Capacity"].get(atm) if "Capacity" in mast else np.nan
        if pd.isna(cap):
            cap = derived.get(atm, np.nan)
        if pd.isna(cap) or cap <= 0:                       # no model history yet: size from raw demand
            cap = _round_up(np.clip(ser.max() * s.safety_factor, 0, s.atm_max_loading), s.cash_unit) * s.capacity_buffer
        cap = float(cap)

        anchor = None
        if atm in ev_by_atm:
            e = ev_by_atm[atm]
            e = e[e["event_date"] <= last + pd.Timedelta(days=1)]
            if len(e):
                anchor = e.iloc[-1]

        if anchor is not None:
            start = pd.Timestamp(anchor["event_date"])
            bal0 = anchor["balance_after"]
            bal0 = cap if pd.isna(bal0) else float(bal0)   # a refill with no stated balance = topped up to capacity
            cap = max(cap, bal0)
            cal = pd.date_range(start, last, freq="D")
            window = ser.reindex(cal) if len(cal) else pd.Series(dtype=float)
            typical = float(ser.tail(28).median())
            n_imputed = int(window.isna().sum())
            balance = max(bal0 - float(window.fillna(typical).sum()), 0.0)
            source = "reported" if n_imputed == 0 else "reported_imputed"
        else:
            seg = _segment_calendar(ser)
            balance = simulate_balance(seg.to_numpy(), cap, s.reorder_threshold_pct, s.sim_refill_lead_days).balance
            source = "simulated"

        pct = round(balance / cap * 100.0, 1) if cap else 0.0
        pred, method = np.nan, None
        if atm in fc.index:
            pred, method = float(fc.at[atm, "predicted"]), fc.at[atm, "method"]
        days = round(balance / max(pred, 1e-6), 1) if not pd.isna(pred) else None
        topup = float(_round_up(max(cap - balance, 0.0), s.cash_unit))
        rows.append({
            **base,
            "ATM_Capacity": round(cap), "Estimated_Cash_Remaining": round(balance),
            "Cash_Remaining_Pct": pct, "Predicted_Demand": None if pd.isna(pred) else round(pred),
            "Days_of_Cash": days, "Refill_Suggestion_Amount": topup,
            "Recommended_Loading": None if pd.isna(pred) else float(recommended_loading([pred], s)[0]),
            "Status": status_from_pct(pct, s),
            "Stockout_Risk": bool((not pd.isna(pred)) and balance < pred),
            "Balance_Source": source, "Forecast_Method": method, "Last_Data_Date": last.date(),
        })
    return pd.DataFrame(rows), as_of


def kpis(status: pd.DataFrame) -> dict:
    """Same formulas as the notebook's KPI cards, plus a few the dashboard was missing."""
    active = status[status["Status"] != "No Data"]
    if active.empty:
        return {"total_atms": 0, "no_data": int((status["Status"] == "No Data").sum())}
    cap, rem = active["ATM_Capacity"].sum(), active["Estimated_Cash_Remaining"].sum()
    days = active["Days_of_Cash"].dropna()
    return {
        "total_atms": int(len(active)),
        "refill_now": int((active["Status"] == "Refill Now").sum()),
        "refill_soon": int((active["Status"] == "Refill Soon").sum()),
        "ok": int((active["Status"] == "OK").sum()),
        "under_1_day": int((days < 1).sum()),
        "stockout_risk": int(active["Stockout_Risk"].fillna(False).astype(bool).sum()) if "Stockout_Risk" in active else 0,
        "total_refill_needed": float(active["Refill_Suggestion_Amount"].sum()),
        "avg_days_of_cash": round(float(days.mean()), 1) if len(days) else None,
        "median_days_of_cash": round(float(days.median()), 1) if len(days) else None,
        "network_utilization_pct": round(float(rem / cap * 100), 1) if cap else 0.0,
        "no_data": int((status["Status"] == "No Data").sum()),
    }

"""Load raw ATM history (the notebook's two CSV halves) into the database, with validation."""
from __future__ import annotations

import io
from pathlib import Path
from typing import BinaryIO

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ml.features import RAW_REQUIRED, TXN_FEATURES
from ..models import Atm, Withdrawal
from .dbutil import upsert

_COLMAP = {c: c for c in RAW_REQUIRED + TXN_FEATURES}
_DB_COLS = {
    "Daily_Withdrawal": "daily_withdrawal", "Transaction_Count": "transaction_count",
    "Average_Transaction": "average_transaction", "Median_Transaction": "median_transaction",
    "Maximum_Transaction": "maximum_transaction", "Minimum_Transaction": "minimum_transaction",
    "Withdrawal_Std": "withdrawal_std",
}


class IngestError(ValueError):
    pass


def validate_and_clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Return (clean frame, report). Mirrors the notebook's checks (dates, duplicates, ATM coverage)
    and adds the ones it was missing (negatives, holes)."""
    missing = [c for c in RAW_REQUIRED if c not in df.columns]
    if missing:
        raise IngestError(f"Missing required column(s): {missing}. Found: {list(df.columns)[:15]}")
    rep: dict = {"rows_in": int(len(df)), "warnings": []}
    keep = [c for c in RAW_REQUIRED + TXN_FEATURES if c in df.columns]
    d = df[keep].copy()
    d["ATMID"] = d["ATMID"].astype(str).str.strip()
    d["Date"] = pd.to_datetime(d["Date"], errors="coerce").dt.normalize()
    bad_dates = int(d["Date"].isna().sum())
    d = d.dropna(subset=["Date"])
    for c in [c for c in keep if c not in ("ATMID", "Date")]:
        d[c] = pd.to_numeric(d[c], errors="coerce")
    dups = int(d.duplicated(subset=["ATMID", "Date"]).sum())
    d = d.drop_duplicates(subset=["ATMID", "Date"], keep="first")      # notebook rule: keep first
    neg = int((d["Daily_Withdrawal"] < 0).sum())
    d.loc[d["Daily_Withdrawal"] < 0, "Daily_Withdrawal"] = float("nan")
    no_w = int(d["Daily_Withdrawal"].isna().sum())
    d = d.sort_values(["ATMID", "Date"]).reset_index(drop=True)

    rep.update(rows_out=int(len(d)), invalid_dates_dropped=bad_dates, duplicates_removed=dups,
               negative_withdrawals_nulled=neg, rows_without_withdrawal=no_w,
               atms=int(d["ATMID"].nunique()),
               date_min=str(d["Date"].min().date()) if len(d) else None,
               date_max=str(d["Date"].max().date()) if len(d) else None,
               transaction_columns_present=[c for c in TXN_FEATURES if c in d.columns])
    if dups:
        rep["warnings"].append(f"{dups} duplicate ATM/date rows removed (kept first).")
    if neg:
        rep["warnings"].append(f"{neg} negative withdrawal(s) set to missing.")
    if len(d):
        days = pd.date_range(d["Date"].min(), d["Date"].max(), freq="D")
        present = set(d["Date"].unique())
        holes = [x for x in days if x not in present]
        rep["calendar_days_with_no_data_at_all"] = len(holes)
        if holes:
            rep["warnings"].append(
                f"{len(holes)} calendar day(s) have no rows for ANY ATM (first {holes[0].date()}, last {holes[-1].date()}). "
                "Features are gap-aware, but forecasts for those periods are unavailable.")
    return d, rep


def read_csv_bytes(content: bytes | BinaryIO | str | Path) -> pd.DataFrame:
    if isinstance(content, (str, Path)):
        return pd.read_csv(content)
    if isinstance(content, bytes):
        return pd.read_csv(io.BytesIO(content))
    return pd.read_csv(content)


def ingest_frames(db: Session, frames: list[pd.DataFrame]) -> dict:
    """Concatenate (halves share a schema), validate, upsert. Re-ingesting is idempotent."""
    cols = [set(f.columns) for f in frames]
    if len(cols) > 1 and any(c != cols[0] for c in cols[1:]):
        raise IngestError("The CSV files do not share the same columns: "
                          + "; ".join(f"file{i+1} only: {sorted(c - cols[0])}" for i, c in enumerate(cols[1:]) if c - cols[0]))
    clean, rep = validate_and_clean(pd.concat(frames, ignore_index=True))
    if clean.empty:
        raise IngestError("No usable rows after validation.")

    existing = set(db.scalars(select(Atm.atm_id)))
    new = [a for a in clean["ATMID"].unique() if a not in existing]
    upsert(db, Atm, [{"atm_id": a, "capacity_source": "derived", "active": True} for a in new], ["atm_id"])

    rows = []
    cols_map = {k: v for k, v in _DB_COLS.items() if k in clean.columns}
    for rec in clean.rename(columns={"ATMID": "atm_id", "Date": "date", **cols_map}).to_dict("records"):
        rows.append(rec)
    n = upsert(db, Withdrawal, rows, ["atm_id", "date"])
    db.commit()
    rep.update(rows_upserted=n, new_atms=len(new))
    return rep


def load_withdrawals(db: Session) -> pd.DataFrame:
    """Raw history in the notebook's column names."""
    q = select(Withdrawal)
    df = pd.read_sql(q, db.get_bind())
    inv = {v: k for k, v in _DB_COLS.items()}
    df = df.rename(columns={"atm_id": "ATMID", "date": "Date", **inv})
    df["Date"] = pd.to_datetime(df["Date"])
    return df.sort_values(["ATMID", "Date"]).reset_index(drop=True)


def ingest_master(db: Session, df: pd.DataFrame) -> dict:
    """Master data CSV: ATMID, Location (optional), Capacity (optional)."""
    cols = {c.lower(): c for c in df.columns}
    if "atmid" not in cols:
        raise IngestError("Master file needs an ATMID column (optional: Location, Capacity).")
    rows = []
    for rec in df.to_dict("records"):
        atm = str(rec[cols["atmid"]]).strip()
        r = {"atm_id": atm}
        if "location" in cols and pd.notna(rec[cols["location"]]):
            r["location"] = str(rec[cols["location"]]).strip()
        if "capacity" in cols and pd.notna(rec[cols["capacity"]]):
            r["capacity"] = float(rec[cols["capacity"]])
            r["capacity_source"] = "master"
        rows.append(r)
    # upsert only the columns that exist in *every* row, group by shape to avoid wiping fields
    shapes: dict[tuple, list] = {}
    for r in rows:
        shapes.setdefault(tuple(sorted(r)), []).append(r)
    for grp in shapes.values():
        upsert(db, Atm, grp, ["atm_id"])
    db.commit()
    return {"rows": len(rows)}

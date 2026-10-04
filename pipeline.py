"""Orchestration: raw data -> features -> (train) -> predictions -> cash status snapshot."""
from __future__ import annotations

import logging
import threading

import numpy as np
import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..ml.features import engineer_features, resolve_feature_columns
from ..ml.forecast import build_predictions
from ..ml.registry import NoActiveModel, active_run, load_package, register_trained
from ..ml.training import train_models
from ..models import Atm, AtmStatus, CashEvent, ModelRun, Prediction
from . import cash
from .dbutil import upsert
from .ingest import load_withdrawals

log = logging.getLogger("atm.pipeline")
PIPELINE_LOCK = threading.Lock()      # one heavy job at a time


class NoData(RuntimeError):
    pass


def _features(db: Session):
    raw = load_withdrawals(db)
    if raw.empty or raw["Daily_Withdrawal"].notna().sum() == 0:
        raise NoData("No withdrawal history in the database. Ingest data first (POST /api/data/upload or `cli ingest`).")
    return engineer_features(raw, get_settings().weekend_days), raw


def train(db: Session, models: list[str] | None = None, n_estimators: int = 2000, activate: bool = True) -> ModelRun:
    s = get_settings()
    feats, _ = _features(db)
    res = train_models(feats, models=models, n_estimators=n_estimators, high_demand_pct=s.high_demand_percentile)
    return register_trained(db, res, activate_now=activate)


def _persist_predictions(db: Session, preds: pd.DataFrame, run_id: int) -> int:
    """Upsert predictions. A forecast we issued earlier keeps its original `predicted` value
    once the real demand arrives - so live accuracy is measured against what we actually said."""
    if preds.empty:
        return 0
    issued = {(r.atm_id, r.as_of_date): r for r in db.scalars(select(Prediction).where(Prediction.split == "Forecast"))}
    rows = []
    for r in preds.itertuples(index=False):
        key = (r.ATMID, pd.Timestamp(r.as_of_date).date())
        prev = issued.get(key)
        if prev is not None and r.split not in ("Forecast",):
            rows.append({"atm_id": r.ATMID, "as_of_date": r.as_of_date, "target_date": r.target_date,
                         "predicted": prev.predicted, "actual": r.actual, "split": "Live",
                         "method": prev.method, "model_run_id": prev.model_run_id})
        else:
            rows.append({"atm_id": r.ATMID, "as_of_date": r.as_of_date, "target_date": r.target_date,
                         "predicted": r.predicted, "actual": r.actual, "split": r.split,
                         "method": r.method, "model_run_id": run_id})
    # an issued forecast that no longer maps to any row (data was corrected / removed) is obsolete
    new_keys = {(r["atm_id"], pd.Timestamp(r["as_of_date"]).date()) for r in rows}
    for key, old in issued.items():
        if key not in new_keys:
            db.delete(old)
    db.flush()
    return upsert(db, Prediction, rows, ["atm_id", "as_of_date"])


def _loading_history(db: Session, s) -> pd.Series:
    df = pd.read_sql(select(Prediction.atm_id, Prediction.predicted), db.get_bind())
    if df.empty:
        return pd.Series(dtype=float)
    df["load"] = cash.recommended_loading(df["predicted"], s)
    return df.groupby("atm_id")["load"].max().rename_axis("ATMID")


def build_status(db: Session) -> tuple[pd.DataFrame, pd.Timestamp, int | None]:
    s = get_settings()
    raw = load_withdrawals(db)
    if raw.empty:
        raise NoData("No withdrawal history in the database.")
    last_pred = pd.read_sql(select(Prediction).where(Prediction.split == "Forecast"), db.get_bind())
    if last_pred.empty:   # e.g. dashboard-imported data: use the newest prediction per ATM
        allp = pd.read_sql(select(Prediction), db.get_bind())
        last_pred = allp.sort_values("as_of_date").groupby("atm_id").tail(1) if len(allp) else allp
    fc = last_pred.rename(columns={"atm_id": "ATMID"})[["ATMID", "predicted", "method"]] if len(last_pred) else \
        pd.DataFrame(columns=["ATMID", "predicted", "method"])
    atms = pd.read_sql(select(Atm), db.get_bind())
    master = atms.rename(columns={"atm_id": "ATMID", "location": "Location", "capacity": "Capacity"})[["ATMID", "Location", "Capacity"]]
    events = pd.read_sql(select(CashEvent), db.get_bind())
    status, as_of = cash.compute_status(raw, fc, _loading_history(db, s), master, events, s, known_atms=list(atms["atm_id"]))
    run = active_run(db)
    return status, as_of, run.id if run else None


def persist_status(db: Session, status: pd.DataFrame, as_of: pd.Timestamp, run_id: int | None) -> int:
    snap = as_of.date()
    db.execute(delete(AtmStatus).where(AtmStatus.snapshot_date == snap))
    rows = []
    for r in status.to_dict("records"):
        rows.append({
            "snapshot_date": snap, "atm_id": r["ATMID"], "capacity": r.get("ATM_Capacity"),
            "cash_remaining": r.get("Estimated_Cash_Remaining"), "cash_remaining_pct": r.get("Cash_Remaining_Pct"),
            "predicted_demand": r.get("Predicted_Demand"), "days_of_cash": r.get("Days_of_Cash"),
            "refill_suggestion": r.get("Refill_Suggestion_Amount"), "recommended_loading": r.get("Recommended_Loading"),
            "status": r["Status"], "stockout_risk": bool(r.get("Stockout_Risk") or False),
            "balance_source": r.get("Balance_Source"), "forecast_method": r.get("Forecast_Method"),
            "last_data_date": r.get("Last_Data_Date"), "model_run_id": run_id,
        })
    upsert(db, AtmStatus, rows, ["snapshot_date", "atm_id"])
    db.commit()
    return len(rows)


def refresh(db: Session) -> dict:
    """Recompute predictions with the ACTIVE model and write a fresh status snapshot."""
    s = get_settings()
    run = active_run(db)
    if run is None or not run.artifact_path:
        raise NoActiveModel("No active model. Train one (POST /api/model/train) or import your notebook's "
                            "ATM_Cash_Forecasting_Package.pkl (`python -m app.cli import-model <file>`).")
    feats, _ = _features(db)
    pkg = load_package(run.artifact_path)
    preds = build_predictions(feats, pkg, run, s)
    n_pred = _persist_predictions(db, preds, run.id)
    db.commit()
    status, as_of, run_id = build_status(db)
    n_status = persist_status(db, status, as_of, run_id)
    counts = status["Status"].value_counts().to_dict()
    return {"model_run_id": run.id, "model": run.name, "as_of": str(as_of.date()),
            "predictions_written": n_pred, "atms": n_status, "status_counts": counts}


def train_and_refresh(db: Session, **kw) -> dict:
    run = train(db, **kw)
    out = refresh(db)
    out["trained_run_id"] = run.id
    return out

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..ml.registry import NoActiveModel, active_run, activate
from ..models import ModelRun
from ..schemas import TrainRequest
from ..security import require_api_key
from ..services import jobs, queries
from ..services.pipeline import refresh, train, train_and_refresh

router = APIRouter(prefix="/api", tags=["model"])


def _summary(r: ModelRun, full: bool = False) -> dict:
    out = {"id": r.id, "name": r.name, "source": r.source, "is_active": r.is_active, "created_at": r.created_at,
           "selected_by": r.selected_by, "train_end": r.train_end, "val_end": r.val_end, "test_end": r.test_end,
           "n_features": len(r.feature_columns or []), "notes": r.notes}
    if full:
        out.update(metrics=r.metrics, params=r.params, feature_columns=r.feature_columns)
    return out


@router.get("/model")
def current_model(db: Session = Depends(get_db)):
    """Active model with validation + test metrics for every candidate (MAE, RMSE, MAPE, R2, P/R/F1)."""
    r = active_run(db)
    if r is None:
        raise HTTPException(404, "No active model. Train one with POST /api/model/train.")
    return _summary(r, full=True)


@router.get("/model/runs")
def runs(db: Session = Depends(get_db)):
    return [_summary(r) for r in db.scalars(select(ModelRun).order_by(ModelRun.id.desc()))]


@router.get("/model/feature-importance")
def feature_importance(top: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    r = active_run(db)
    if r is None or not r.feature_importance:
        raise HTTPException(404, "No feature importance stored for the active model.")
    return r.feature_importance[:top]


@router.get("/model/atm-performance")
def atm_performance(worst: bool = False, limit: int = Query(20, ge=1, le=500), db: Session = Depends(get_db)):
    """Per-ATM error of the active model (best first, or worst first with ?worst=true)."""
    r = active_run(db)
    if r is None or not r.atm_performance:
        raise HTTPException(404, "No per-ATM performance stored for the active model.")
    rows = sorted(r.atm_performance, key=lambda x: x["RMSE"], reverse=worst)
    return rows[:limit]


@router.get("/model/monitoring")
def monitoring(db: Session = Depends(get_db)):
    """Accuracy on forecasts issued by the live system and later confirmed by real demand (drift detector)."""
    return queries.monitoring(db)


@router.post("/model/activate/{run_id}", dependencies=[Depends(require_api_key)])
def activate_run(run_id: int, db: Session = Depends(get_db)):
    r = db.get(ModelRun, run_id)
    if r is None or not r.artifact_path:
        raise HTTPException(404, "Unknown run, or run has no loadable model artifact.")
    activate(db, run_id)
    return _summary(db.get(ModelRun, run_id))


@router.post("/model/train", dependencies=[Depends(require_api_key)], status_code=202)
def train_model(body: TrainRequest, background: BackgroundTasks):
    """Retrain LightGBM / XGBoost / CatBoost on the stored history (async job). Picks the winner on
    validation RMSE, activates it and (by default) refreshes predictions and status."""
    if jobs.busy():
        raise HTTPException(409, "Another pipeline job is running.")
    jid = jobs.create("train")
    fn = train_and_refresh if body.refresh_after else (lambda db, **kw: {"trained_run_id": train(db, **kw).id})
    background.add_task(jobs.run, jid, fn, models=body.models, n_estimators=body.n_estimators)
    return {"job": jid}


@router.post("/pipeline/refresh", dependencies=[Depends(require_api_key)], status_code=202)
def pipeline_refresh(background: BackgroundTasks, db: Session = Depends(get_db)):
    """Recompute forecasts with the active model and write a new status snapshot (async job)."""
    if jobs.busy():
        raise HTTPException(409, "Another pipeline job is running.")
    if active_run(db) is None:
        raise NoActiveModel("No active model. Train one (POST /api/model/train) or import your notebook's "
                            "ATM_Cash_Forecasting_Package.pkl (`python -m app.cli import-model <file>`).")
    jid = jobs.create("refresh")
    background.add_task(jobs.run, jid, refresh)
    return {"job": jid}

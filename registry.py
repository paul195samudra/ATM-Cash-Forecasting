"""Persist, load and activate trained model packages."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import ModelRun
from .training import TrainResult

log = logging.getLogger("atm.registry")
_cache: dict[tuple[str, float], dict] = {}


class NoActiveModel(RuntimeError):
    """Raised when a forecast is requested but no model has been trained / imported yet."""


def _d(ts) -> Any:
    return None if ts is None or pd.isna(ts) else pd.Timestamp(ts).date()


def active_run(db: Session) -> ModelRun | None:
    return db.scalars(select(ModelRun).where(ModelRun.is_active.is_(True)).order_by(ModelRun.id.desc())).first()


def activate(db: Session, run_id: int) -> None:
    db.execute(update(ModelRun).values(is_active=False))
    db.execute(update(ModelRun).where(ModelRun.id == run_id).values(is_active=True))
    db.commit()


def register_trained(db: Session, res: TrainResult, activate_now: bool = True) -> ModelRun:
    m = res.splits_meta
    run = ModelRun(
        name=res.selected, source="trained", feature_columns=res.package["feature_columns"],
        train_start=_d(m["train_start"]), train_end=_d(m["train_end"]), val_end=_d(m["validation_end"]),
        test_end=_d(m["test_end"]), metrics=res.metrics, selected_by="validation_rmse",
        feature_importance=res.feature_importance, atm_performance=res.atm_performance,
        params={**res.params, "rows": m["rows"]},
    )
    db.add(run)
    db.flush()
    path = save_package(res.package, run.id)
    run.artifact_path = str(path)
    db.commit()
    if activate_now:
        activate(db, run.id)
    return run


def save_package(package: dict, run_id: int) -> Path:
    d = get_settings().model_dir
    d.mkdir(parents=True, exist_ok=True)
    path = d / f"atm_forecaster_run{run_id}.joblib"
    joblib.dump(package, path)
    return path


def load_package(path: str | Path) -> dict:
    p = Path(path)
    key = (str(p), p.stat().st_mtime)
    if key not in _cache:
        _cache.clear()          # keep one model in memory
        _cache[key] = joblib.load(p)
    return _cache[key]


def import_notebook_package(db: Session, pkl_path: str | Path, activate_now: bool = True) -> ModelRun:
    """Register the `ATM_Cash_Forecasting_Package.pkl` your notebook already saved (cell 87)."""
    pkg = joblib.load(pkl_path)
    for k in ("model", "feature_columns"):
        if k not in pkg:
            raise ValueError(f"{pkl_path} is not a forecasting package: missing '{k}'")
    name = str(pkg.get("model_name", type(pkg["model"]).__name__)).replace(" Test", "")
    run = ModelRun(
        name=name, source="notebook_import", feature_columns=list(pkg["feature_columns"]),
        train_start=_d(pkg.get("training_date_start")), train_end=_d(pkg.get("training_date_end")),
        val_end=_d(pkg.get("validation_date_end")), test_end=_d(pkg.get("test_date_end")),
        notes=f"Imported from {Path(pkl_path).name}. No metrics stored in the pickle.",
    )
    db.add(run)
    db.flush()
    run.artifact_path = str(save_package({"model": pkg["model"], "feature_columns": list(pkg["feature_columns"]),
                                          "model_name": name}, run.id))
    db.commit()
    if activate_now:
        activate(db, run.id)
    return run

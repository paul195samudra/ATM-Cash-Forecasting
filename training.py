"""Training pipeline = the notebook's modelling cells, productionised.

Fixes vs the notebook (all deliberate):
  * LightGBM / XGBoost now really early-stop on the validation set (the notebook passed an
    eval_set but never stopped, so they always built all 2000 trees).
  * The "best model" is chosen on VALIDATION RMSE. The notebook chose it on the test set,
    which makes the reported test score optimistic.
  * Splits are by calendar date (70 / 15 / 15 of unique dates), like the notebook.
  * Outlier caps (per-ATM Q3 + 1.5 IQR) are computed from the training split only and are
    applied to the training target only, like the notebook.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Callable

import numpy as np
import pandas as pd
from sklearn.metrics import (accuracy_score, f1_score, mean_absolute_error, mean_squared_error,
                             precision_score, r2_score, recall_score)

from .features import complete_rows, resolve_feature_columns

log = logging.getLogger("atm.training")

EARLY_STOP = 150
MIN_DATES = 12        # below this a chronological 70/15/15 split is meaningless


# ----------------------------------------------------------------------------- metrics
def evaluate(y_true, y_pred, high_demand_pct: float = 75) -> dict:
    """Same metrics as the notebook's evaluate_model(), returned as plain floats."""
    y_true, y_pred = np.asarray(y_true, float), np.asarray(y_pred, float)
    nz = y_true != 0
    mape = float(np.mean(np.abs((y_true[nz] - y_pred[nz]) / y_true[nz])) * 100) if nz.any() else float("nan")
    thr = float(np.percentile(y_true, high_demand_pct))
    yt, yp = (y_true >= thr).astype(int), (y_pred >= thr).astype(int)
    return {
        "MAE": float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "MAPE": mape,
        "R2": float(r2_score(y_true, y_pred)) if len(y_true) > 1 else float("nan"),
        "Precision": float(precision_score(yt, yp, zero_division=0)),
        "Recall": float(recall_score(yt, yp, zero_division=0)),
        "F1": float(f1_score(yt, yp, zero_division=0)),
        "Accuracy_cls": float(accuracy_score(yt, yp)),
        "High_Demand_Threshold": thr,
        "n": int(len(y_true)),
    }


# ----------------------------------------------------------------------------- splitting / caps
@dataclass
class Splits:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame
    train_dates: np.ndarray
    validation_dates: np.ndarray
    test_dates: np.ndarray


def chronological_split(model_df: pd.DataFrame, train_frac=0.70, val_frac=0.85) -> Splits:
    dates = np.sort(model_df["Date"].unique())
    n = len(dates)
    if n < MIN_DATES:
        raise ValueError(f"Only {n} usable dates after feature engineering; need at least {MIN_DATES}. "
                         "Load more history (features need 28 contiguous days before the first usable row).")
    a, b = int(n * train_frac), int(n * val_frac)
    tr, va, te = dates[:a], dates[a:b], dates[b:]
    pick = lambda ds: model_df[model_df["Date"].isin(ds)].copy()  # noqa: E731
    return Splits(pick(tr), pick(va), pick(te), tr, va, te)


def train_only_caps(train: pd.DataFrame) -> tuple[pd.Series, float]:
    q = train.groupby("ATMID")["Target_Next_Day"]
    q1, q3 = q.quantile(0.25), q.quantile(0.75)
    iqr = q3 - q1
    fallback = float(train["Target_Next_Day"].quantile(0.99))
    upper = (q3 + 1.5 * iqr).where(iqr > 0, fallback)
    return upper, fallback


# ----------------------------------------------------------------------------- model factory
def _make_lightgbm(n_estimators: int):
    from lightgbm import LGBMRegressor
    return LGBMRegressor(objective="regression", n_estimators=n_estimators, learning_rate=0.02, num_leaves=31,
                         min_child_samples=20, subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1,
                         reg_lambda=1.0, random_state=42, n_jobs=-1, verbose=-1)


def _make_xgboost(n_estimators: int):
    from xgboost import XGBRegressor
    return XGBRegressor(objective="reg:squarederror", n_estimators=n_estimators, learning_rate=0.02, max_depth=7,
                        min_child_weight=5, subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0,
                        random_state=42, n_jobs=-1, tree_method="hist", early_stopping_rounds=EARLY_STOP)


def _make_catboost(n_estimators: int):
    from catboost import CatBoostRegressor
    return CatBoostRegressor(iterations=n_estimators, learning_rate=0.03, depth=8, loss_function="RMSE",
                             l2_leaf_reg=5, random_seed=42, verbose=0, allow_writing_files=False,
                             early_stopping_rounds=EARLY_STOP)


def _fit(name: str, model, X_tr, y_tr, X_va, y_va):
    import warnings
    warnings.filterwarnings("ignore", message=".*eval_set.*deprecated.*")
    if name == "LightGBM":
        from lightgbm import early_stopping
        model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], callbacks=[early_stopping(EARLY_STOP, verbose=False)])
        return int(model.best_iteration_ or model.n_estimators)
    if name == "XGBoost":
        model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)
        return int(getattr(model, "best_iteration", model.n_estimators - 1)) + 1
    model.fit(X_tr, y_tr, eval_set=(X_va, y_va), use_best_model=True)
    return int(model.get_best_iteration() + 1)


MODEL_FACTORIES: dict[str, Callable[[int], object]] = {
    "LightGBM": _make_lightgbm,
    "XGBoost": _make_xgboost,
    "CatBoost": _make_catboost,
}


def _importance(model, cols: list[str]) -> list[dict]:
    imp = np.asarray(getattr(model, "feature_importances_", np.zeros(len(cols))), float)
    total = imp.sum() or 1.0
    rows = [{"feature": c, "importance": float(v / total * 100)} for c, v in zip(cols, imp)]
    return sorted(rows, key=lambda r: -r["importance"])


# ----------------------------------------------------------------------------- orchestration
@dataclass
class TrainResult:
    package: dict                      # joblib-able: model + metadata
    metrics: dict                      # {model: {"validation": {...}, "test": {...}, "best_iteration": n}}
    selected: str
    feature_importance: list
    atm_performance: list
    params: dict
    splits_meta: dict = field(default_factory=dict)


def train_models(features: pd.DataFrame, models: list[str] | None = None, n_estimators: int = 2000,
                 high_demand_pct: float = 75, feature_cols: list[str] | None = None) -> TrainResult:
    feature_cols = feature_cols or resolve_feature_columns(features)
    names = [m for m in (models or list(MODEL_FACTORIES)) if m in MODEL_FACTORIES]
    if not names:
        raise ValueError(f"No valid model requested. Choose from {list(MODEL_FACTORIES)}")

    ok = complete_rows(features, feature_cols) & features["Target_Next_Day"].notna()
    model_df = features.loc[ok, ["ATMID", "Date", *feature_cols, "Target_Next_Day"]].copy()
    model_df = model_df.sort_values(["Date", "ATMID"]).reset_index(drop=True)
    if model_df.empty:
        raise ValueError("No rows with a complete feature set and a known next-day target.")

    sp = chronological_split(model_df)
    assert sp.train["Date"].max() < sp.validation["Date"].min() <= sp.validation["Date"].max() < sp.test["Date"].min()

    upper, fallback = train_only_caps(sp.train)
    cap = sp.train["ATMID"].map(upper).fillna(fallback)
    y_tr = sp.train["Target_Next_Day"].clip(upper=cap)          # capped: spikes can't dominate training
    X_tr, X_va, X_te = sp.train[feature_cols], sp.validation[feature_cols], sp.test[feature_cols]
    y_va, y_te = sp.validation["Target_Next_Day"], sp.test["Target_Next_Day"]  # real demand: honest scores

    fitted, metrics = {}, {}
    for name in names:
        log.info("training %s ...", name)
        model = MODEL_FACTORIES[name](n_estimators)
        best_it = _fit(name, model, X_tr, y_tr, X_va, y_va)
        fitted[name] = model
        metrics[name] = {
            "validation": evaluate(y_va, model.predict(X_va), high_demand_pct),
            "test": evaluate(y_te, model.predict(X_te), high_demand_pct),
            "best_iteration": best_it,
        }
        log.info("%s  val RMSE %.0f  test RMSE %.0f", name, metrics[name]["validation"]["RMSE"], metrics[name]["test"]["RMSE"])

    selected = min(metrics, key=lambda n: metrics[n]["validation"]["RMSE"])      # validation, NOT test
    best = fitted[selected]

    all_pred = best.predict(model_df[feature_cols])
    d = model_df[["ATMID", "Target_Next_Day"]].assign(pred=all_pred)
    d["abs_err"] = (d["Target_Next_Day"] - d["pred"]).abs()
    d["sq_err"] = (d["Target_Next_Day"] - d["pred"]) ** 2
    perf = d.groupby("ATMID").agg(MAE=("abs_err", "mean"), MSE=("sq_err", "mean"),
                                  Average_Actual_Demand=("Target_Next_Day", "mean"),
                                  Average_Predicted_Demand=("pred", "mean"))
    perf["RMSE"] = np.sqrt(perf.pop("MSE"))
    atm_perf = perf.reset_index().sort_values("RMSE").to_dict("records")

    ts = lambda a: pd.Timestamp(a)  # noqa: E731
    meta = {
        "train_start": ts(sp.train_dates.min()), "train_end": ts(sp.train_dates.max()),
        "validation_start": ts(sp.validation_dates.min()), "validation_end": ts(sp.validation_dates.max()),
        "test_start": ts(sp.test_dates.min()), "test_end": ts(sp.test_dates.max()),
        "rows": {"train": len(sp.train), "validation": len(sp.validation), "test": len(sp.test)},
    }
    package = {"model": best, "feature_columns": feature_cols, "model_name": selected, **meta}
    return TrainResult(package, metrics, selected, _importance(best, feature_cols), atm_perf,
                       {"n_estimators": n_estimators, "models": names, "early_stopping_rounds": EARLY_STOP,
                        "high_demand_percentile": high_demand_pct, "capped_training_rows_pct":
                        float((y_tr < sp.train["Target_Next_Day"]).mean() * 100)}, meta)


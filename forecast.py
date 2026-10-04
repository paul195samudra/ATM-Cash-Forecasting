"""Turn features + a model into predictions (history back-test AND tomorrow's forecast)."""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..config import Settings
from .features import complete_rows

FALLBACK_WINDOW_DAYS = 7


def _split_label(as_of: pd.Series, run) -> pd.Series:
    """Train / Validation / Test per the model's date boundaries; later days are genuinely unseen => Live."""
    if run is None or run.train_end is None:
        return pd.Series("Unknown", index=as_of.index)
    d = as_of.dt.date
    out = pd.Series("Live", index=as_of.index)
    if run.test_end is not None:
        out[d <= run.test_end] = "Test"
    if run.val_end is not None:
        out[d <= run.val_end] = "Validation"
    out[d <= run.train_end] = "Train"
    return out


def build_predictions(features: pd.DataFrame, pkg: dict, run, s: Settings) -> pd.DataFrame:
    """Return rows: ATMID, as_of_date, target_date, predicted, actual, split, method.

    * back-test rows: every complete feature row whose next-day target is known
    * live rows: one per reporting ATM, dated its latest observed day (actual = NULL).
      An ATM without enough history for the model (new ATM) falls back to its trailing
      7-day mean and is labelled method='fallback_mean'.
    """
    cols = list(pkg["feature_columns"])
    absent = [c for c in cols if c not in features.columns or features[c].isna().all()]
    if absent:
        raise ValueError(
            f"The active model needs feature(s) {absent} that are not in the stored data. "
            "Ingest the raw CSVs that contain them, or retrain (training adapts to the columns available).")
    model = pkg["model"]
    ok = complete_rows(features, cols)
    pred = pd.Series(np.nan, index=features.index)
    if ok.any():
        pred[ok] = np.clip(model.predict(features.loc[ok, cols]), 0, None)

    # ---- back-test rows
    bt = features[ok & features["Target_Next_Day"].notna()]
    bt = pd.DataFrame({
        "ATMID": bt["ATMID"], "as_of_date": bt["Date"], "target_date": bt["Date"] + pd.Timedelta(days=1),
        "predicted": pred[bt.index], "actual": bt["Target_Next_Day"], "method": "model",
    })
    bt["split"] = _split_label(bt["as_of_date"], run)

    # ---- live next-day forecast per reporting ATM
    obs = features[features["observed"]]
    last_idx = obs.groupby("ATMID")["Date"].idxmax()
    last = obs.loc[last_idx]
    global_last = obs["Date"].max()
    last = last[(global_last - last["Date"]).dt.days <= s.stale_after_days]
    live_rows = []
    for idx, r in last.iterrows():
        if not np.isnan(pred.get(idx, np.nan)):
            p, m = float(pred[idx]), "model"
        else:
            win = features[(features["ATMID"] == r["ATMID"]) & features["observed"] &
                           (features["Date"] > r["Date"] - pd.Timedelta(days=FALLBACK_WINDOW_DAYS))]
            if win.empty:
                continue
            p, m = float(win["Daily_Withdrawal"].mean()), "fallback_mean"
        live_rows.append({"ATMID": r["ATMID"], "as_of_date": r["Date"], "target_date": r["Date"] + pd.Timedelta(days=1),
                          "predicted": p, "actual": np.nan, "method": m, "split": "Forecast"})
    live = pd.DataFrame(live_rows)
    out = pd.concat([bt, live], ignore_index=True) if len(live) else bt
    return out.reset_index(drop=True)

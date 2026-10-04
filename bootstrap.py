"""Seed the database from the finished dashboard HTML (`ATM_Cash_Dashboard_final_output.html`).

Why: the dashboard embeds the *results* of your notebook run (status table + per-ATM actual vs
predicted history) as JSON. This lets the API serve exactly what the dashboard shows, immediately,
without the original CSVs. It also reconstructs the raw daily withdrawals (the `actual` series IS
next-day demand, so withdrawal on day d+1 = actual on row d), which is enough to retrain a
withdrawal-only model. For full-fidelity retraining ingest your original CSVs afterwards.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..models import Atm, AtmStatus, ModelRun, Prediction, Withdrawal
from .dbutil import upsert


def _extract(html: str, name: str, until: str) -> object:
    a = html.index(f"const {name} = ") + len(f"const {name} = ")
    b = html.index(until, a)
    return json.loads(html[a:b])


def parse_dashboard(path: str | Path) -> tuple[list[dict], dict, str]:
    html = Path(path).read_text(encoding="utf-8")
    atm_data = _extract(html, "atmData", ";\n")
    history = _extract(html, "history", ";\nconst statusColors")
    m = re.search(r"Data as of\s*<strong>(\d{4}-\d{2}-\d{2})</strong>", html)
    if not m:
        raise ValueError("Could not find the 'Data as of' date in the HTML.")
    return atm_data, history, m.group(1)


def split_by_notebook_rule(dates: list[pd.Timestamp]) -> dict:
    """Notebook rule: 70 / 15 / 15 of the unique usable dates."""
    d = sorted(set(dates))
    n = len(d)
    a, b = int(n * 0.70), int(n * 0.85)
    return {"train_end": d[a - 1], "val_end": d[b - 1], "test_end": d[-1], "train_start": d[0]}


def bootstrap_from_dashboard(db: Session, html_path: str | Path) -> dict:
    atm_data, history, as_of_str = parse_dashboard(html_path)
    as_of = pd.Timestamp(as_of_str)

    # ---- master data
    ids = sorted(set(history) | {str(a["ATMID"]).strip() for a in atm_data})
    cap = {str(a["ATMID"]).strip(): a.get("ATM_Capacity") for a in atm_data}
    loc = {}
    for a in atm_data:
        l = str(a.get("Location", "")).strip()
        loc[str(a["ATMID"]).strip()] = None if "not in dataset" in l else l
    upsert(db, Atm, [{"atm_id": i, "location": loc.get(i), "capacity": cap.get(i),
                      "capacity_source": "dashboard_import" if cap.get(i) else "derived", "active": True} for i in ids],
           ["atm_id"])

    # ---- history -> withdrawals + predictions
    recs = []
    for atm, h in history.items():
        for d, act, pr in zip(h["dates"], h["actual"], h["predicted"]):
            recs.append((atm, pd.Timestamp(d), act, pr))
    hist = pd.DataFrame(recs, columns=["ATMID", "as_of", "actual", "predicted"])
    bounds = split_by_notebook_rule(list(hist["as_of"].unique()))

    run = ModelRun(name="Dashboard import", source="dashboard_import", is_active=False,
                   train_start=bounds["train_start"].date(), train_end=bounds["train_end"].date(),
                   val_end=bounds["val_end"].date(), test_end=bounds["test_end"].date(),
                   notes=f"Predictions imported from {Path(html_path).name}; not a loadable model. "
                         "Train or import a model to enable /api/pipeline/refresh.")
    db.add(run)
    db.flush()

    wd = pd.DataFrame({"atm_id": hist["ATMID"], "date": hist["as_of"] + pd.Timedelta(days=1),
                       "daily_withdrawal": hist["actual"]})
    n_w = upsert(db, Withdrawal, wd.to_dict("records"), ["atm_id", "date"])

    def lab(d):
        return "Train" if d <= bounds["train_end"] else "Validation" if d <= bounds["val_end"] else "Test"
    pr = pd.DataFrame({
        "atm_id": hist["ATMID"], "as_of_date": hist["as_of"], "target_date": hist["as_of"] + pd.Timedelta(days=1),
        "predicted": hist["predicted"].clip(lower=0), "actual": hist["actual"],
        "split": hist["as_of"].map(lab), "method": "dashboard_import", "model_run_id": run.id})
    n_p = upsert(db, Prediction, pr.to_dict("records"), ["atm_id", "as_of_date"])

    # ---- the status table exactly as the dashboard showed it (kept for comparison / instant display)
    db.execute(delete(AtmStatus).where(AtmStatus.snapshot_date == as_of.date()))
    rows = [{
        "snapshot_date": as_of.date(), "atm_id": str(a["ATMID"]).strip(), "capacity": a["ATM_Capacity"],
        "cash_remaining": a["Estimated_Cash_Remaining"], "cash_remaining_pct": a["Cash_Remaining_Pct"],
        "predicted_demand": a["Predicted_Demand"], "days_of_cash": a["Days_of_Cash"],
        "refill_suggestion": a["Refill_Suggestion_Amount"], "status": a["Status"], "stockout_risk": False,
        "balance_source": "dashboard_import", "forecast_method": "dashboard_import",
        "last_data_date": as_of.date(), "model_run_id": run.id} for a in atm_data]
    reporting = {r["atm_id"] for r in rows}
    for i in ids:
        if i not in reporting:
            last = hist.loc[hist["ATMID"] == i, "as_of"].max() + pd.Timedelta(days=1)
            rows.append({"snapshot_date": as_of.date(), "atm_id": i, "status": "No Data", "stockout_risk": False,
                         "last_data_date": last.date(), "balance_source": "dashboard_import", "model_run_id": run.id})
    upsert(db, AtmStatus, rows, ["snapshot_date", "atm_id"])
    db.commit()
    return {"atms": len(ids), "reporting": len(reporting), "no_data": len(ids) - len(reporting),
            "withdrawal_rows": n_w, "prediction_rows": n_p, "as_of": as_of_str,
            "splits": {k: str(v.date()) for k, v in bounds.items()}}

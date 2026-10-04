import json

import pytest

from app.db import session_scope
from app.models import Atm, AtmStatus, Prediction, Withdrawal
from app.services.bootstrap import bootstrap_from_dashboard
from sqlalchemy import func, select


def _html(tmp_path):
    dates = [f"2024-0{1 + i // 28}-{1 + i % 28:02d}" for i in range(20)]
    atm = [{"ATMID": "A1", "Location": "ATM A1     (location not in dataset)", "ATM_Capacity": 1e6, "Estimated_Cash_Remaining": 5e5,
            "Cash_Remaining_Pct": 50.0, "Predicted_Demand": 2e5, "Refill_Suggestion_Amount": 5e5, "Status": "OK", "Days_of_Cash": 2.5}]
    hist = {"A1": {"dates": dates, "actual": [100000.0 + i * 1000 for i in range(20)], "predicted": [101000.0] * 20},
            "GONE": {"dates": dates[:5], "actual": [1.0] * 5, "predicted": [2.0] * 5}}
    p = tmp_path / "d.html"
    p.write_text(f"<div>Data as of <strong>2024-01-20</strong></div><script>\nconst atmData = {json.dumps(atm)};\n"
                 f"const history = {json.dumps(hist)};\nconst statusColors = {{}};</script>")
    return p


def test_bootstrap_seeds_everything(env, tmp_path):
    with session_scope() as db:
        out = bootstrap_from_dashboard(db, _html(tmp_path))
        assert out["atms"] == 2 and out["reporting"] == 1 and out["no_data"] == 1
        assert db.scalar(select(func.count()).select_from(Withdrawal)) == 25
        # withdrawal on day d+1 equals the dashboard's `actual` on row d
        w = db.get(Withdrawal, ("A1", __import__("datetime").date(2024, 1, 2)))
        assert w.daily_withdrawal == 100000.0
        assert db.get(Atm, "A1").location is None                       # "(location not in dataset)" is not a location
        assert db.get(AtmStatus, (__import__("datetime").date(2024, 1, 20), "GONE")).status == "No Data"
        splits = {p.split for p in db.scalars(select(Prediction))}
        assert {"Train", "Validation", "Test"} <= splits

import numpy as np
import pandas as pd
import pytest

from app.config import get_settings
from app.db import init_db, reset_engine


@pytest.fixture()
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 't.db'}")
    monkeypatch.setenv("MODEL_DIR", str(tmp_path / "models"))
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("SIM_REFILL_LEAD_DAYS", raising=False)
    get_settings.cache_clear()
    reset_engine()
    init_db()
    yield tmp_path
    reset_engine()
    get_settings.cache_clear()


def make_raw(n_atms=12, start="2024-01-01", days=150, seed=0, with_txn=True, hole=None):
    """Synthetic ATM history with a weekly cycle (Fri/Sat low) and per-ATM scale.
    hole=(start, end) removes those calendar days for every ATM."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start, periods=days)
    rows = []
    for i in range(n_atms):
        scale = rng.uniform(150_000, 900_000)
        for d in dates:
            weekly = {4: .45, 5: .6}.get(d.dayofweek, 1.0)
            cnt = max(int(rng.normal(60, 8) * weekly * scale / 400_000), 1)
            avg = scale / 60 * rng.uniform(.8, 1.2)
            w = round(cnt * avg / 500) * 500
            r = {"ATMID": f"T{i:03d}", "Date": d, "Daily_Withdrawal": float(w)}
            if with_txn:
                r.update(Transaction_Count=float(cnt), Average_Transaction=float(avg), Median_Transaction=float(avg * .9),
                         Maximum_Transaction=float(avg * 3), Minimum_Transaction=float(avg * .2), Withdrawal_Std=float(avg * .5))
            rows.append(r)
    df = pd.DataFrame(rows)
    if hole:
        df = df[~df["Date"].between(pd.Timestamp(hole[0]), pd.Timestamp(hole[1]))]
    return df.reset_index(drop=True)

import numpy as np
import pandas as pd
import pytest

from app.config import get_settings
from app.services import cash


@pytest.fixture()
def s(env):
    return get_settings()


def test_instant_refill_hides_the_crossing_but_lead_time_shows_it():
    w = np.array([300, 300, 300])                       # capacity 1000, reorder at 200
    hidden = cash.simulate_balance(w, 1000, 20, lead_days=0)      # == notebook behaviour
    shown = cash.simulate_balance(w, 1000, 20, lead_days=1)
    assert hidden.balance == 1000                       # looks 100% full / "OK" although it hit 10%
    assert shown.balance == 100 and shown.refill_pending


def test_balance_never_negative():
    assert cash.simulate_balance(np.array([5000.0]), 1000, 20, 1).balance == 0


def test_status_thresholds(s):
    assert cash.status_from_pct(20, s) == "Refill Now"
    assert cash.status_from_pct(20.1, s) == "Refill Soon"
    assert cash.status_from_pct(40, s) == "Refill Soon"
    assert cash.status_from_pct(40.1, s) == "OK"


def test_recommended_loading_rounds_up_and_caps(s):
    assert cash.recommended_loading([100_000], s)[0] == 105_000
    assert cash.recommended_loading([100_001], s)[0] == 105_500
    assert cash.recommended_loading([9e9], s)[0] == s.atm_max_loading
    assert cash.recommended_loading([-5], s)[0] == 0


def _inputs(days=30, dem=100_000.0, atms=("A", "B")):
    d = pd.date_range("2024-06-01", periods=days)
    w = pd.DataFrame([(a, x, dem) for a in atms for x in d], columns=["ATMID", "Date", "Daily_Withdrawal"])
    fc = pd.DataFrame({"ATMID": list(atms), "predicted": [dem] * len(atms), "method": "model"})
    master = pd.DataFrame({"ATMID": list(atms), "Location": [None] * len(atms), "Capacity": [1_000_000.0] * len(atms)})
    ev = pd.DataFrame(columns=["id", "atm_id", "event_date", "event_type", "balance_after"])
    return w, fc, pd.Series(dtype=float), master, ev


def test_reported_balance_beats_simulation(s):
    w, fc, hist, master, ev = _inputs()
    ev = pd.DataFrame([{"id": 1, "atm_id": "A", "event_date": "2024-06-28", "event_type": "balance_reading", "balance_after": 700_000.0}])
    st, as_of = cash.compute_status(w, fc, hist, master, ev, s)
    a = st.set_index("ATMID").loc["A"]
    # reading is the balance at the start of Jun 28; withdrawals of Jun 28, 29, 30 (3 x 100k) are deducted
    assert a["Estimated_Cash_Remaining"] == 400_000 and a["Balance_Source"] == "reported" and a["Status"] == "Refill Soon"
    assert st.set_index("ATMID").loc["B", "Balance_Source"] == "simulated"


def test_refill_event_without_balance_means_full(s):
    w, fc, hist, master, _ = _inputs()
    ev = pd.DataFrame([{"id": 1, "atm_id": "A", "event_date": "2024-06-30", "event_type": "refill", "balance_after": np.nan}])
    st, _ = cash.compute_status(w, fc, hist, master, ev, s)
    assert st.set_index("ATMID").loc["A", "Estimated_Cash_Remaining"] == 900_000     # full vault minus Jun 30's demand


def test_stale_atm_is_reported_not_dropped(s):
    w, fc, hist, master, ev = _inputs()
    w = w[~((w["ATMID"] == "B") & (w["Date"] > "2024-06-10"))]
    st, _ = cash.compute_status(w, fc, hist, master, ev, s)
    b = st.set_index("ATMID").loc["B"]
    assert b["Status"] == "No Data" and str(b["Last_Data_Date"]) == "2024-06-10"
    assert cash.kpis(st)["no_data"] == 1 and cash.kpis(st)["total_atms"] == 1


def test_kpis_and_stockout_flag(s):
    w, fc, hist, master, ev = _inputs(dem=250_000.0)         # vault 1M, 250k/day => cycles quickly
    st, _ = cash.compute_status(w, fc, hist, master, ev, s)
    k = cash.kpis(st)
    assert k["total_atms"] == 2 and k["refill_now"] + k["refill_soon"] + k["ok"] == 2
    row = st.iloc[0]
    assert row["Stockout_Risk"] == (row["Estimated_Cash_Remaining"] < row["Predicted_Demand"])


def test_capacity_derived_from_loading_history_when_no_master(s):
    w, fc, _, master, ev = _inputs()
    master["Capacity"] = np.nan
    hist = pd.Series({"A": 600_000.0, "B": 600_000.0})
    st, _ = cash.compute_status(w, fc, hist, master, ev, s)
    assert st.set_index("ATMID").loc["A", "ATM_Capacity"] == 900_000     # 1.5 x peak loading (notebook rule)

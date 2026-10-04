import pandas as pd
import pytest

from app.db import session_scope
from app.services import ingest
from .conftest import make_raw


def test_validation_report(env):
    df = make_raw(n_atms=2, days=20)
    df["Date"] = df["Date"].astype(str)                                 # as read from a CSV
    df = pd.concat([df, df.iloc[:3]])                                   # duplicates
    df.loc[df.index[5], "Daily_Withdrawal"] = -10.0                     # negative
    df.loc[df.index[6], "Date"] = "not a date"
    clean, rep = ingest.validate_and_clean(df)
    assert rep["duplicates_removed"] == 3 and rep["negative_withdrawals_nulled"] == 1 and rep["invalid_dates_dropped"] == 1
    assert (clean["Daily_Withdrawal"].dropna() >= 0).all() and rep["warnings"]


def test_network_gap_is_reported():
    _, rep = ingest.validate_and_clean(make_raw(n_atms=2, days=100, hole=("2024-02-01", "2024-03-10")))
    assert rep["calendar_days_with_no_data_at_all"] == 39
    assert any("no rows for ANY ATM" in w for w in rep["warnings"])


def test_missing_columns_rejected():
    with pytest.raises(ingest.IngestError, match="Missing required"):
        ingest.validate_and_clean(pd.DataFrame({"ATMID": ["A"], "Date": ["2024-01-01"]}))


def test_mismatched_halves_rejected(env):
    a, b = make_raw(n_atms=1, days=5), make_raw(n_atms=1, days=5, with_txn=False)
    with session_scope() as db, pytest.raises(ingest.IngestError, match="same columns"):
        ingest.ingest_frames(db, [a, b])


def test_ingest_is_idempotent_and_roundtrips(env):
    df = make_raw(n_atms=3, days=30)
    with session_scope() as db:
        r1 = ingest.ingest_frames(db, [df])
        r2 = ingest.ingest_frames(db, [df])
        back = ingest.load_withdrawals(db)
    assert r1["new_atms"] == 3 and r2["new_atms"] == 0
    assert len(back) == 90
    m = back.merge(df, on=["ATMID", "Date"], suffixes=("", "_o"))
    assert (m["Daily_Withdrawal"] == m["Daily_Withdrawal_o"]).all() and (m["Transaction_Count"] == m["Transaction_Count_o"]).all()


def test_master_upload_sets_location_and_capacity(env):
    from app.models import Atm
    with session_scope() as db:
        ingest.ingest_frames(db, [make_raw(n_atms=2, days=5)])
        ingest.ingest_master(db, pd.DataFrame({"ATMID": ["T000", "T001"], "Location": ["Main St", None], "Capacity": [2e6, None]}))
        a, b = db.get(Atm, "T000"), db.get(Atm, "T001")
        assert (a.location, a.capacity, a.capacity_source) == ("Main St", 2e6, "master")
        assert b.location is None and b.capacity is None

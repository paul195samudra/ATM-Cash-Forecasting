import io
import time

import joblib
import pytest
from fastapi.testclient import TestClient

from .conftest import make_raw


def _csv(df):
    b = io.BytesIO()
    df.to_csv(b, index=False)
    return b.getvalue()


def _wait(c, jid, timeout=60):
    t0 = time.time()
    while time.time() - t0 < timeout:
        j = c.get(f"/api/jobs/{jid}").json()
        if j["status"] in ("done", "failed"):
            return j
        time.sleep(.2)
    raise AssertionError("job timeout")


@pytest.fixture()
def client(env):
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def loaded(client):
    """Two CSV halves with a hole between them, like the notebook's two files."""
    a = make_raw(n_atms=8, start="2024-01-01", days=70, seed=1)
    b = make_raw(n_atms=8, start="2024-06-01", days=100, seed=2)
    r = client.post("/api/data/upload", files=[("files", ("a.csv", _csv(a))), ("files", ("b.csv", _csv(b)))],
                    data={"refresh_after": "false"})
    assert r.status_code == 200, r.text
    return client, r.json()


def test_empty_system_is_graceful(client):
    assert client.get("/api/health").json()["active_model"] is None
    d = client.get("/api/dashboard").json()
    assert d["atms"] == [] and d["as_of"] is None
    assert client.get("/api/model").status_code == 404
    assert client.post("/api/pipeline/refresh").status_code == 409        # fail fast, no doomed job


def test_upload_reports_gap_and_is_idempotent(loaded):
    c, rep = loaded
    assert rep["ingest"]["rows_upserted"] == 8 * 170 and rep["ingest"]["calendar_days_with_no_data_at_all"] > 0
    dq = c.get("/api/data-quality").json()
    assert dq["network_gaps"] and dq["network_gaps"][0]["days"] == 82


def test_bad_upload_is_422(client):
    r = client.post("/api/data/upload", files=[("files", ("x.csv", b"a,b\n1,2\n"))])
    assert r.status_code == 422 and "Missing required" in r.json()["detail"]


def test_full_lifecycle(loaded):
    c, _ = loaded
    jid = c.post("/api/model/train", json={"models": ["LightGBM"], "n_estimators": 150}).json()["job"]
    j = _wait(c, jid)
    assert j["status"] == "done", j
    assert j["result"]["status_counts"]

    m = c.get("/api/model").json()
    assert m["name"] == "LightGBM" and m["selected_by"] == "validation_rmse" and m["metrics"]["LightGBM"]["test"]["RMSE"] > 0
    assert len(c.get("/api/model/feature-importance?top=5").json()) == 5
    assert c.get("/api/model/atm-performance?worst=true&limit=3").json()[0]["RMSE"] >= c.get("/api/model/atm-performance?limit=3").json()[0]["RMSE"]

    d = c.get("/api/dashboard").json()
    assert d["kpis"]["total_atms"] == 8 and d["as_of"] == "2024-09-08"
    row = d["atms"][0]
    for k in ("ATMID", "Location", "ATM_Capacity", "Estimated_Cash_Remaining", "Cash_Remaining_Pct", "Predicted_Demand",
              "Refill_Suggestion_Amount", "Status", "Days_of_Cash"):                 # the dashboard's contract
        assert k in row

    h = c.get(f"/api/atms/{row['ATMID']}/history").json()
    assert len(h["dates"]) == len(h["actual"]) == len(h["predicted"]) == len(h["split"])
    assert h["split"][-1] == "Forecast" and h["actual"][-1] is None and h["dates"][-1] == "2024-09-09"
    assert {"Train", "Validation", "Test"} <= set(h["split"])

    # filters / sorting / paging
    allr = c.get("/api/atms?limit=3&offset=0").json()
    assert allr["total"] == 8 and len(allr["items"]) == 3
    assert all(a["Status"] == "OK" for a in c.get("/api/atms?status=OK").json()["items"])
    assert c.get("/api/atms?q=t00&sort=ATMID&order=desc").json()["items"][0]["ATMID"] == "T007"
    assert c.get("/api/atms/NOPE").status_code == 404
    plan = c.get("/api/refill-plan").json()
    assert [i["Priority"] for i in plan["items"]] == list(range(1, plan["count"] + 1))
    assert c.get("/api/refill-plan.csv").headers["content-type"].startswith("text/csv")

    # new day arrives: forecast we issued is scored against reality
    before = {a["ATMID"]: a["Predicted_Demand"] for a in d["atms"]}
    rows = [{"ATMID": k, "Date": "2024-09-09", "Daily_Withdrawal": 250000.0, **{x: 100.0 for x in (
        "Transaction_Count", "Average_Transaction", "Median_Transaction", "Maximum_Transaction", "Minimum_Transaction", "Withdrawal_Std")}}
            for k in before]
    r = c.post("/api/data/withdrawals", json={"rows": rows}).json()
    assert _wait(c, r["job"])["status"] == "done"
    assert c.get("/api/dashboard").json()["as_of"] == "2024-09-09"
    h2 = c.get(f"/api/atms/{row['ATMID']}/history").json()
    assert h2["split"][-2] == "Live" and h2["actual"][-2] == 250000.0
    assert h2["predicted"][-2] == before[row["ATMID"]]               # the forecast AS ISSUED is preserved
    assert c.get("/api/model/monitoring").json()["live_rows"] == 8


def test_cash_events_override_simulation(loaded):
    c, _ = loaded
    _wait(c, c.post("/api/model/train", json={"models": ["LightGBM"], "n_estimators": 80}).json()["job"])
    atm = c.get("/api/atms?limit=1").json()["items"][0]
    assert atm["Balance_Source"] == "simulated"
    r = c.post("/api/cash-events", json={"atm_id": atm["ATMID"], "event_date": "2024-09-08", "event_type": "refill"})
    assert r.status_code == 201
    a = r.json()["atm"]
    # refilled to full at the start of the last data day, then that day's real withdrawal is deducted
    last_w = c.get(f"/api/atms/{atm['ATMID']}/history").json()["actual"][-2]
    assert a["Balance_Source"] == "reported"
    assert a["Estimated_Cash_Remaining"] == round(a["ATM_Capacity"] - last_w)
    assert c.post("/api/cash-events", json={"atm_id": atm["ATMID"], "event_date": "2024-09-08", "event_type": "balance_reading"}).status_code == 422
    assert c.post("/api/cash-events", json={"atm_id": "ZZZ", "event_date": "2024-09-08", "event_type": "refill"}).status_code == 404
    eid = c.get(f"/api/cash-events?atm_id={atm['ATMID']}").json()[0]["id"]
    assert c.delete(f"/api/cash-events/{eid}").status_code == 200
    assert c.get(f"/api/atms/{atm['ATMID']}").json()["Balance_Source"] == "simulated"


def test_master_data_and_capacity_override(loaded):
    c, _ = loaded
    _wait(c, c.post("/api/model/train", json={"models": ["LightGBM"], "n_estimators": 80}).json()["job"])
    csv = b"ATMID,Location,Capacity\nT000,Main Branch,5000000\n"
    assert c.post("/api/atms/master", files={"file": ("m.csv", csv)}).status_code == 200
    a = c.get("/api/atms/T000").json()
    assert a["Location"] == "Main Branch" and a["ATM_Capacity"] == 5000000 and a["Capacity_Source"] == "master"
    assert c.put("/api/atms/T000", json={"capacity": -1}).status_code == 422


def test_api_key_protects_writes_only(env, monkeypatch):
    monkeypatch.setenv("API_KEY", "k3y")
    from app.config import get_settings
    get_settings.cache_clear()
    from app.main import app
    with TestClient(app) as c:
        assert c.get("/api/health").status_code == 200                     # reads stay open
        assert c.post("/api/model/train", json={}).status_code == 401
        assert c.post("/api/data/upload", files=[("files", ("a.csv", b"x"))]).status_code == 401
        assert c.post("/api/cash-events", json={}).status_code == 401
        assert c.post("/api/pipeline/refresh", headers={"X-API-Key": "k3y"}).status_code == 409  # authed, then no model


def test_import_notebook_package_roundtrip(loaded, env):
    """The pickle your notebook saves (cell 87) can be registered and used for forecasting."""
    from app.db import session_scope
    from app.ml.features import engineer_features
    from app.ml.training import train_models
    from app.ml.registry import import_notebook_package
    from app.services import ingest, pipeline
    with session_scope() as db:
        feats = engineer_features(ingest.load_withdrawals(db))
    res = train_models(feats, models=["LightGBM"], n_estimators=80)
    pkl = env / "ATM_Cash_Forecasting_Package.pkl"
    joblib.dump({"model": res.package["model"], "feature_columns": res.package["feature_columns"], "model_name": "LightGBM Test",
                 "training_date_end": res.package["train_end"], "validation_date_end": res.package["validation_end"],
                 "test_date_end": res.package["test_end"]}, pkl)
    c, _ = loaded
    with session_scope() as db:
        run = import_notebook_package(db, pkl)
        assert run.source == "notebook_import" and run.name == "LightGBM"
        out = pipeline.refresh(db)
    assert out["atms"] == 8
    assert c.get("/api/dashboard").json()["kpis"]["total_atms"] == 8

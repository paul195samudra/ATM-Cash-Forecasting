import numpy as np
import pytest

from app.ml.features import engineer_features
from app.ml.training import MIN_DATES, chronological_split, evaluate, train_models, train_only_caps
from .conftest import make_raw


@pytest.fixture(scope="module")
def feats():
    return engineer_features(make_raw(n_atms=10, days=160, seed=3))


def test_metrics_are_correct():
    y = np.array([100, 200, 300, 400.0])
    m = evaluate(y, y + 10)
    assert m["MAE"] == 10 and m["RMSE"] == 10 and m["R2"] > 0.99
    assert evaluate(y, y)["F1"] == 1.0


def test_split_is_chronological_70_15_15(feats):
    from app.ml.features import complete_rows, resolve_feature_columns
    cols = resolve_feature_columns(feats)
    m = feats[complete_rows(feats, cols) & feats["Target_Next_Day"].notna()]
    sp = chronological_split(m)
    assert sp.train["Date"].max() < sp.validation["Date"].min() <= sp.validation["Date"].max() < sp.test["Date"].min()
    n = m["Date"].nunique()
    assert abs(len(sp.train_dates) / n - .70) < .02 and abs(len(sp.test_dates) / n - .15) < .03


def test_caps_come_from_training_split_only(feats):
    from app.ml.features import complete_rows, resolve_feature_columns
    cols = resolve_feature_columns(feats)
    m = feats[complete_rows(feats, cols) & feats["Target_Next_Day"].notna()]
    sp = chronological_split(m)
    upper, _ = train_only_caps(sp.train)
    q = sp.train.groupby("ATMID")["Target_Next_Day"]
    expect = q.quantile(.75) + 1.5 * (q.quantile(.75) - q.quantile(.25))
    assert np.allclose(upper.sort_index().values, expect.sort_index().values)


def test_train_selects_on_validation_and_early_stops(feats):
    res = train_models(feats, models=["LightGBM", "XGBoost"], n_estimators=400)
    assert set(res.metrics) == {"LightGBM", "XGBoost"}
    best = min(res.metrics, key=lambda n: res.metrics[n]["validation"]["RMSE"])
    assert res.selected == best
    for n, m in res.metrics.items():
        assert 0 < m["best_iteration"] <= 400
        for k in ("MAE", "RMSE", "MAPE", "R2", "Precision", "Recall", "F1"):
            assert k in m["test"]
    assert res.package["feature_columns"] and res.package["train_end"] < res.package["validation_end"] < res.package["test_end"]
    assert abs(sum(r["importance"] for r in res.feature_importance) - 100) < 1e-6
    assert len(res.atm_performance) == 10


def test_beats_naive_baseline(feats):
    res = train_models(feats, models=["LightGBM"], n_estimators=300)
    assert res.metrics["LightGBM"]["test"]["R2"] > 0.3


def test_too_little_history_gives_clear_error():
    f = engineer_features(make_raw(n_atms=3, days=40))
    with pytest.raises(ValueError, match="usable dates|complete feature"):
        train_models(f, models=["LightGBM"], n_estimators=20)


def test_unknown_model_name():
    with pytest.raises(ValueError):
        train_models(engineer_features(make_raw(days=100)), models=["Nope"])

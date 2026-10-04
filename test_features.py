import numpy as np
import pandas as pd

from app.ml.features import FULL_FEATURES, complete_rows, engineer_features, resolve_feature_columns
from .conftest import make_raw


def test_feature_set_is_the_notebooks_36():
    assert len(FULL_FEATURES) == 36 and len(set(FULL_FEATURES)) == 36


def test_leading_nan_counts_match_the_notebook():
    """The notebook printed these NaN counts per ATM; our definitions must reproduce them."""
    f = engineer_features(make_raw(n_atms=1, days=60))
    expected = {"Withdrawal_Lag_1": 1, "Withdrawal_Lag_2": 2, "Withdrawal_Lag_3": 3, "Withdrawal_Lag_7": 7,
                "Withdrawal_Lag_14": 14, "Withdrawal_Lag_21": 21, "Withdrawal_Lag_28": 28,
                "Rolling_Mean_3": 3, "Rolling_Mean_7": 7, "Rolling_Mean_14": 14, "Rolling_Mean_28": 28,
                "Rolling_Std_7": 7, "Rolling_Std_14": 14, "Rolling_Std_28": 28, "EWMA_7": 1, "EWMA_14": 1,
                "Demand_Change_1D": 2, "Demand_Change_7D": 7, "Demand_Growth_1D": 2, "Demand_Growth_7D": 7,
                "Short_Long_Demand_Ratio": 28, "Weekday_Average_Demand": 7}
    for col, n in expected.items():
        assert f[col].isna().sum() == n, col


def test_lag_values_are_correct():
    raw = make_raw(n_atms=1, days=40)
    f = engineer_features(raw).set_index("Date")
    w = raw.set_index("Date")["Daily_Withdrawal"]
    d = pd.Timestamp("2024-02-05")
    assert f.loc[d, "Withdrawal_Lag_1"] == w[d - pd.Timedelta(days=1)]
    assert f.loc[d, "Withdrawal_Lag_7"] == w[d - pd.Timedelta(days=7)]
    # rolling windows are shifted by one day: they must NOT include today's value
    assert np.isclose(f.loc[d, "Rolling_Mean_7"], w[d - pd.Timedelta(days=7): d - pd.Timedelta(days=1)].mean())
    # target is tomorrow
    assert f.loc[d, "Target_Next_Day"] == w[d + pd.Timedelta(days=1)]


def test_hole_never_leaks_stale_values():
    """Your data has a 125-day hole. A row-based shift would use a 4-month-old value as 'yesterday'."""
    raw = make_raw(n_atms=2, days=200, hole=("2024-02-15", "2024-05-15"))
    f = engineer_features(raw)
    first_after = f[(f["ATMID"] == "T000") & (f["Date"] == "2024-05-16")].iloc[0]
    assert np.isnan(first_after["Withdrawal_Lag_1"]) and np.isnan(first_after["Withdrawal_Lag_28"])
    last_before = f[(f["ATMID"] == "T000") & (f["Date"] == "2024-02-14")].iloc[0]
    assert np.isnan(last_before["Target_Next_Day"])           # next day is missing, not 2024-05-16's value
    cols = resolve_feature_columns(f)
    ok = complete_rows(f, cols) & f["Target_Next_Day"].notna()
    usable = f[ok]
    # nothing usable may sit in the first 28 days after the hole
    assert usable[(usable["Date"] > "2024-05-15") & (usable["Date"] < "2024-06-13")].empty


def test_no_infinities_and_zero_lags_handled():
    raw = make_raw(n_atms=1, days=60)
    raw.loc[raw.index[10:14], "Daily_Withdrawal"] = 0.0          # zero-demand days (7% of your data)
    f = engineer_features(raw)
    num = f[FULL_FEATURES[:21]].to_numpy(dtype=float)
    assert not np.isinf(num).any()


def test_fallback_features_without_transaction_columns():
    f = engineer_features(make_raw(with_txn=False, days=60))
    cols = resolve_feature_columns(f)
    assert "Transaction_Count" not in cols and "Daily_Withdrawal" in cols
    assert len(resolve_feature_columns(engineer_features(make_raw(days=60)))) == 36


def test_weekday_average_excludes_today():
    raw = make_raw(n_atms=1, days=60)
    f = engineer_features(raw).set_index("Date")
    d = pd.Timestamp("2024-02-12")  # a Monday
    same = raw[(raw["Date"] < d) & (raw["Date"].dt.dayofweek == d.dayofweek)]["Daily_Withdrawal"]
    assert np.isclose(f.loc[d, "Weekday_Average_Demand"], same.mean())


def test_calendar_conventions():
    f = engineer_features(make_raw(n_atms=1, days=14), weekend_days=(4, 5)).set_index("Date")
    assert f.loc["2024-01-01", "DayOfWeek"] == 0               # Monday = 0 (the notebook's labels said Sunday)
    assert f.loc["2024-01-05", "IsWeekend"] == 1 and f.loc["2024-01-06", "IsWeekend"] == 1
    assert f.loc["2024-01-07", "IsWeekend"] == 0

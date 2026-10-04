"""Feature engineering - a gap-safe re-implementation of the notebook's feature set.

Definitions were reverse-engineered from the NaN counts the notebook printed
(e.g. Lag_k has k leading NaNs per ATM, Rolling_*_w has w, Demand_Change_7D has 7).
Run `python -m app.cli verify-features --csv <your featured csv>` to prove parity
against the pre-computed columns in your original files.

Key difference from the notebook: the notebook used row-based groupby().shift(),
which silently treats the row after a missing stretch as "yesterday". Your data has a
125-day hole (late Mar -> late Jul). Here every ATM is re-indexed to a *calendar*, so a
lag across a hole is NaN (and the row is dropped) instead of a 4-month-old number.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

TXN_FEATURES = [
    "Transaction_Count", "Average_Transaction", "Median_Transaction",
    "Maximum_Transaction", "Minimum_Transaction", "Withdrawal_Std",
]

# Exactly the 36 features (and order) of the notebook's `feature_cols`.
FULL_FEATURES = [
    "Withdrawal_Lag_1", "Withdrawal_Lag_2", "Withdrawal_Lag_3", "Withdrawal_Lag_7",
    "Withdrawal_Lag_14", "Withdrawal_Lag_21", "Withdrawal_Lag_28",
    "Rolling_Mean_3", "Rolling_Mean_7", "Rolling_Mean_14", "Rolling_Mean_28",
    "Rolling_Std_7", "Rolling_Std_14", "Rolling_Std_28",
    "EWMA_7", "EWMA_14",
    "Demand_Change_1D", "Demand_Change_7D", "Demand_Growth_1D", "Demand_Growth_7D",
    "Short_Long_Demand_Ratio",
    *TXN_FEATURES,
    "Day", "DayOfWeek", "Month", "Quarter", "WeekOfYear",
    "IsWeekend", "IsMonthStart", "IsMonthEnd",
    "Weekday_Average_Demand",
]

LAGS = (1, 2, 3, 7, 14, 21, 28)
ROLL_MEAN = (3, 7, 14, 28)
ROLL_STD = (7, 14, 28)
EWMA_SPANS = (7, 14)

RAW_REQUIRED = ["ATMID", "Date", "Daily_Withdrawal"]


def resolve_feature_columns(df: pd.DataFrame) -> list[str]:
    """36 notebook features when transaction stats exist; otherwise drop them and add the
    same-day withdrawal itself (the transaction stats were its only same-day signal)."""
    has_txn = all(c in df.columns and df[c].notna().any() for c in TXN_FEATURES)
    if has_txn:
        return list(FULL_FEATURES)
    return [c for c in FULL_FEATURES if c not in TXN_FEATURES] + ["Daily_Withdrawal"]


def _calendar_frame(raw: pd.DataFrame) -> pd.DataFrame:
    """Re-index every ATM to a gap-free daily calendar between its first and last date."""
    raw = raw.sort_values(["ATMID", "Date"])
    bounds = raw.groupby("ATMID")["Date"].agg(lo="min", hi="max")
    days = pd.date_range(raw["Date"].min(), raw["Date"].max(), freq="D")
    grid = pd.MultiIndex.from_product([bounds.index, days], names=["ATMID", "Date"]).to_frame(index=False)
    grid = grid.merge(bounds, left_on="ATMID", right_index=True)
    grid = grid[(grid["Date"] >= grid["lo"]) & (grid["Date"] <= grid["hi"])].drop(columns=["lo", "hi"])
    out = grid.merge(raw, on=["ATMID", "Date"], how="left")
    return out.sort_values(["ATMID", "Date"]).reset_index(drop=True)


def engineer_features(raw: pd.DataFrame, weekend_days: tuple[int, ...] = (4, 5)) -> pd.DataFrame:
    """raw: columns ATMID, Date, Daily_Withdrawal (+ optional transaction stats).
    Returns a calendar-indexed frame with all features, `observed` and `Target_Next_Day`."""
    missing = [c for c in RAW_REQUIRED if c not in raw.columns]
    if missing:
        raise ValueError(f"Missing required column(s): {missing}")
    raw = raw.copy()
    raw["ATMID"] = raw["ATMID"].astype(str).str.strip()
    raw["Date"] = pd.to_datetime(raw["Date"]).dt.normalize()

    df = _calendar_frame(raw)
    df["observed"] = df["Daily_Withdrawal"].notna()
    atm = df["ATMID"]
    w = df["Daily_Withdrawal"]
    g = w.groupby(atm, sort=False)

    # --- lags (calendar-based: a hole produces NaN, never a stale value) ---
    for k in LAGS:
        df[f"Withdrawal_Lag_{k}"] = g.shift(k)

    # --- rolling stats on the series shifted by one day (no same-day information) ---
    prev = g.shift(1)
    pg = prev.groupby(atm, sort=False)
    for k in ROLL_MEAN:
        df[f"Rolling_Mean_{k}"] = pg.transform(lambda s, k=k: s.rolling(k, min_periods=k).mean())
    for k in ROLL_STD:
        df[f"Rolling_Std_{k}"] = pg.transform(lambda s, k=k: s.rolling(k, min_periods=k).std())
    for k in EWMA_SPANS:
        e = pg.transform(lambda s, k=k: s.ewm(span=k, adjust=False, min_periods=1).mean())
        df[f"EWMA_{k}"] = e.where(prev.notna())

    # --- demand trend (built from lags, matching the notebook's NaN counts: 2 and 7) ---
    l1, l2, l7 = df["Withdrawal_Lag_1"], df["Withdrawal_Lag_2"], df["Withdrawal_Lag_7"]
    df["Demand_Change_1D"] = l1 - l2
    df["Demand_Change_7D"] = l1 - l7
    # growth = change / base; a zero base gives 0 growth instead of +/-inf (trees reject inf)
    df["Demand_Growth_1D"] = np.where(l2.notna() & l1.notna(), np.where(l2 > 0, (l1 - l2) / l2.where(l2 > 0), 0.0), np.nan)
    df["Demand_Growth_7D"] = np.where(l7.notna() & l1.notna(), np.where(l7 > 0, (l1 - l7) / l7.where(l7 > 0), 0.0), np.nan)
    rm7, rm28 = df["Rolling_Mean_7"], df["Rolling_Mean_28"]
    df["Short_Long_Demand_Ratio"] = np.where(rm7.notna() & rm28.notna(), np.where(rm28 > 0, rm7 / rm28.where(rm28 > 0), 1.0), np.nan)

    # --- calendar ---
    d = df["Date"].dt
    df["Day"] = d.day
    df["Month"] = d.month
    df["Year"] = d.year
    df["DayOfWeek"] = d.dayofweek          # Monday = 0 (the notebook's weekday_names labels were off by one)
    df["WeekOfYear"] = d.isocalendar().week.astype(int)
    df["Quarter"] = d.quarter
    df["IsWeekend"] = df["DayOfWeek"].isin(weekend_days).astype(int)
    df["IsMonthStart"] = d.is_month_start.astype(int)
    df["IsMonthEnd"] = d.is_month_end.astype(int)

    # --- historical same-weekday average (expanding, excludes the current day) ---
    df["Weekday_Average_Demand"] = np.nan
    obs = df.loc[df["observed"], ["ATMID", "DayOfWeek", "Daily_Withdrawal"]]
    wda = obs.groupby(["ATMID", "DayOfWeek"], sort=False)["Daily_Withdrawal"].transform(
        lambda s: s.shift(1).expanding(min_periods=1).mean()
    )
    df.loc[obs.index, "Weekday_Average_Demand"] = wda

    # --- target: next *calendar* day's withdrawal (NaN if that day is missing) ---
    df["Target_Next_Day"] = g.shift(-1)
    return df


def complete_rows(df: pd.DataFrame, feature_cols: list[str]) -> pd.Series:
    """Rows we can safely feed to a model: observed and every feature present."""
    return df["observed"] & df[feature_cols].notna().all(axis=1)

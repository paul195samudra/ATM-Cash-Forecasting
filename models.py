"""Database schema."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Atm(Base):
    """Master data. `capacity` NULL => derived from history (see services/cash.py)."""
    __tablename__ = "atms"
    atm_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    location: Mapped[str | None] = mapped_column(String(255))
    capacity: Mapped[float | None] = mapped_column(Float)
    capacity_source: Mapped[str] = mapped_column(String(16), default="derived")  # derived | master | dashboard_import
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class Withdrawal(Base):
    """Raw daily history (the notebook's ATM_Featured_Dataset_*.csv raw columns)."""
    __tablename__ = "withdrawals"
    atm_id: Mapped[str] = mapped_column(String(32), ForeignKey("atms.atm_id"), primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    daily_withdrawal: Mapped[float | None] = mapped_column(Float)
    transaction_count: Mapped[float | None] = mapped_column(Float)
    average_transaction: Mapped[float | None] = mapped_column(Float)
    median_transaction: Mapped[float | None] = mapped_column(Float)
    maximum_transaction: Mapped[float | None] = mapped_column(Float)
    minimum_transaction: Mapped[float | None] = mapped_column(Float)
    withdrawal_std: Mapped[float | None] = mapped_column(Float)
    __table_args__ = (Index("ix_withdrawals_date", "date"),)


class ModelRun(Base):
    __tablename__ = "model_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64))
    source: Mapped[str] = mapped_column(String(32), default="trained")  # trained | notebook_import | dashboard_import
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    artifact_path: Mapped[str | None] = mapped_column(String(512))
    feature_columns: Mapped[list | None] = mapped_column(JSON)
    train_start: Mapped[date | None] = mapped_column(Date)
    train_end: Mapped[date | None] = mapped_column(Date)
    val_end: Mapped[date | None] = mapped_column(Date)
    test_end: Mapped[date | None] = mapped_column(Date)
    metrics: Mapped[dict | None] = mapped_column(JSON)               # per model: validation + test
    selected_by: Mapped[str | None] = mapped_column(String(32))
    feature_importance: Mapped[list | None] = mapped_column(JSON)
    atm_performance: Mapped[list | None] = mapped_column(JSON)
    params: Mapped[dict | None] = mapped_column(JSON)
    notes: Mapped[str | None] = mapped_column(Text)


class Prediction(Base):
    """One row per (ATM, as-of day). `predicted` is the forecast of withdrawals on `target_date`.
    `actual` is filled once that day has happened (NULL for the live forecast)."""
    __tablename__ = "predictions"
    atm_id: Mapped[str] = mapped_column(String(32), ForeignKey("atms.atm_id"), primary_key=True)
    as_of_date: Mapped[date] = mapped_column(Date, primary_key=True)
    target_date: Mapped[date] = mapped_column(Date)
    predicted: Mapped[float] = mapped_column(Float)
    actual: Mapped[float | None] = mapped_column(Float)
    split: Mapped[str] = mapped_column(String(12), default="Live")  # Train | Validation | Test | Live | Forecast
    method: Mapped[str] = mapped_column(String(16), default="model")  # model | fallback_mean | dashboard_import
    model_run_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("model_runs.id"))
    __table_args__ = (Index("ix_predictions_target", "target_date"),)


class CashEvent(Base):
    """Ground truth from operations. Overrides the simulation when present.
    Both types state the vault balance at the START of `event_date` (after any load)."""
    __tablename__ = "cash_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    atm_id: Mapped[str] = mapped_column(String(32), ForeignKey("atms.atm_id"), index=True)
    event_date: Mapped[date] = mapped_column(Date)
    event_type: Mapped[str] = mapped_column(String(20))   # refill | balance_reading
    amount_loaded: Mapped[float | None] = mapped_column(Float)
    balance_after: Mapped[float | None] = mapped_column(Float)
    note: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class AtmStatus(Base):
    """Daily status snapshot (what the dashboard table shows)."""
    __tablename__ = "atm_status"
    snapshot_date: Mapped[date] = mapped_column(Date, primary_key=True)
    atm_id: Mapped[str] = mapped_column(String(32), ForeignKey("atms.atm_id"), primary_key=True)
    capacity: Mapped[float | None] = mapped_column(Float)
    cash_remaining: Mapped[float | None] = mapped_column(Float)
    cash_remaining_pct: Mapped[float | None] = mapped_column(Float)
    predicted_demand: Mapped[float | None] = mapped_column(Float)
    days_of_cash: Mapped[float | None] = mapped_column(Float)
    refill_suggestion: Mapped[float | None] = mapped_column(Float)
    recommended_loading: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(16))          # Refill Now | Refill Soon | OK | No Data
    stockout_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    balance_source: Mapped[str | None] = mapped_column(String(24))  # reported | reported_imputed | simulated | dashboard_import
    forecast_method: Mapped[str | None] = mapped_column(String(16))
    last_data_date: Mapped[date | None] = mapped_column(Date)
    model_run_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    kind: Mapped[str] = mapped_column(String(24))
    status: Mapped[str] = mapped_column(String(12), default="queued")  # queued | running | done | failed
    message: Mapped[str | None] = mapped_column(Text)
    result: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)

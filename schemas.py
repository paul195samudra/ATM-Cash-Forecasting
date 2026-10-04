"""Pydantic request/response models (these drive the OpenAPI docs at /docs)."""
from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Status = Literal["Refill Now", "Refill Soon", "OK", "No Data"]


class StatusRow(BaseModel):
    ATMID: str
    Location: str
    ATM_Capacity: Optional[float] = None
    Estimated_Cash_Remaining: Optional[float] = None
    Cash_Remaining_Pct: Optional[float] = None
    Predicted_Demand: Optional[float] = None
    Days_of_Cash: Optional[float] = None
    Refill_Suggestion_Amount: Optional[float] = None
    Recommended_Loading: Optional[float] = None
    Status: Status
    Stockout_Risk: bool = False
    Balance_Source: Optional[str] = None
    Forecast_Method: Optional[str] = None
    Last_Data_Date: Optional[str] = None


class Kpis(BaseModel):
    total_atms: int = 0
    refill_now: int = 0
    refill_soon: int = 0
    ok: int = 0
    under_1_day: int = 0
    stockout_risk: int = 0
    total_refill_needed: float = 0
    avg_days_of_cash: Optional[float] = None
    median_days_of_cash: Optional[float] = None
    network_utilization_pct: float = 0
    no_data: int = 0


class DashboardOut(BaseModel):
    as_of: Optional[str] = None
    kpis: Kpis = Kpis()
    atms: list[StatusRow] = []


class AtmList(BaseModel):
    total: int
    items: list[StatusRow]


class HistoryOut(BaseModel):
    atm_id: str
    dates: list[str]
    as_of: list[str]
    actual: list[Optional[float]]
    predicted: list[float]
    split: list[str]


class AtmUpdate(BaseModel):
    location: Optional[str] = Field(None, max_length=255)
    capacity: Optional[float] = Field(None, gt=0)
    active: Optional[bool] = None


class CashEventIn(BaseModel):
    atm_id: str
    event_date: date
    event_type: Literal["refill", "balance_reading"]
    balance_after: Optional[float] = Field(None, ge=0, description="Vault balance at the START of event_date (after any load).")
    amount_loaded: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=255)

    @field_validator("atm_id")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    def check(self) -> "CashEventIn":
        if self.event_type == "balance_reading" and self.balance_after is None:
            raise ValueError("balance_reading requires balance_after")
        return self


class CashEventsBulk(BaseModel):
    events: list[CashEventIn] = Field(min_length=1, max_length=5000)


class WithdrawalRow(BaseModel):
    ATMID: str
    Date: date
    Daily_Withdrawal: Optional[float] = None
    Transaction_Count: Optional[float] = None
    Average_Transaction: Optional[float] = None
    Median_Transaction: Optional[float] = None
    Maximum_Transaction: Optional[float] = None
    Minimum_Transaction: Optional[float] = None
    Withdrawal_Std: Optional[float] = None


class WithdrawalsIn(BaseModel):
    rows: list[WithdrawalRow] = Field(min_length=1, max_length=200_000)


class TrainRequest(BaseModel):
    models: Optional[list[Literal["LightGBM", "XGBoost", "CatBoost"]]] = None
    n_estimators: int = Field(2000, ge=10, le=10_000)
    refresh_after: bool = True

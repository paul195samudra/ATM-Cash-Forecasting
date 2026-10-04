"""Central configuration. Every business rule from the notebook lives here so it
can be changed with an environment variable instead of editing code."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _f(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


def _i(name: str, default: int) -> int:
    return int(float(os.environ.get(name, default)))


@dataclass(frozen=True)
class Settings:
    database_url: str
    model_dir: Path
    api_key: str | None
    cors_origins: tuple[str, ...]

    reorder_threshold_pct: float      # notebook: REORDER_THRESHOLD_PCT
    medium_threshold_pct: float       # notebook: MEDIUM_CASH_THRESHOLD_PCT
    capacity_buffer: float            # notebook: CAPACITY_BUFFER
    safety_factor: float              # notebook: SAFETY_FACTOR
    atm_max_loading: float            # notebook: ATM_MAX_CAPACITY
    cash_unit: int                    # notebook: CASH_UNIT
    high_demand_percentile: float     # notebook: evaluate_model(high_demand_pct=75)

    sim_refill_lead_days: int
    stale_after_days: int
    weekend_days: tuple[int, ...]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    base = Path(__file__).resolve().parent.parent
    weekend = tuple(int(x) for x in os.environ.get("WEEKEND_DAYS", "4,5").split(",") if x.strip() != "")
    origins = tuple(x.strip() for x in os.environ.get("CORS_ORIGINS", "*").split(",") if x.strip())
    return Settings(
        database_url=os.environ.get("DATABASE_URL", f"sqlite:///{base / 'data' / 'atm.db'}"),
        model_dir=Path(os.environ.get("MODEL_DIR", base / "models")),
        api_key=os.environ.get("API_KEY") or None,
        cors_origins=origins or ("*",),
        reorder_threshold_pct=_f("REORDER_THRESHOLD_PCT", 20),
        medium_threshold_pct=_f("MEDIUM_THRESHOLD_PCT", 40),
        capacity_buffer=_f("CAPACITY_BUFFER", 1.5),
        safety_factor=_f("SAFETY_FACTOR", 1.05),
        atm_max_loading=_f("ATM_MAX_LOADING", 1_500_000),
        cash_unit=_i("CASH_UNIT", 500),
        high_demand_percentile=_f("HIGH_DEMAND_PERCENTILE", 75),
        sim_refill_lead_days=_i("SIM_REFILL_LEAD_DAYS", 1),
        stale_after_days=_i("STALE_AFTER_DAYS", 3),
        weekend_days=weekend,
    )

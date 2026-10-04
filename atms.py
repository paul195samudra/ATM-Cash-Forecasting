from __future__ import annotations

from datetime import date
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Atm
from ..schemas import AtmList, AtmUpdate, DashboardOut, HistoryOut, Kpis, StatusRow
from ..security import require_api_key
from ..services import ingest, queries
from ..services.pipeline import NoData, build_status, persist_status

router = APIRouter(prefix="/api", tags=["atms"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    """Everything the dashboard needs in one call: as-of date, KPI cards and the full status table."""
    return queries.dashboard_payload(db)


@router.get("/kpis", response_model=Kpis)
def kpis(db: Session = Depends(get_db)):
    return queries.dashboard_payload(db)["kpis"]


@router.get("/atms", response_model=AtmList)
def list_atms(
    q: Optional[str] = Query(None, description="Substring of ATM id or location"),
    status: Annotated[Optional[list[Literal["Refill Now", "Refill Soon", "OK", "No Data"]]], Query()] = None,
    max_days: Optional[float] = Query(None, description="Days of cash strictly below"),
    min_days: Optional[float] = Query(None, description="Days of cash at or above"),
    max_pct: Optional[float] = Query(None, description="Remaining % at or below"),
    min_pct: Optional[float] = Query(None, description="Remaining % above"),
    sort: str = "Days_of_Cash", order: Literal["asc", "desc"] = "asc",
    limit: int = Query(500, ge=1, le=5000), offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return queries.list_atms(db, q=q, status=status, max_days=max_days, min_days=min_days, max_pct=max_pct,
                             min_pct=min_pct, sort=sort, order=order, limit=limit, offset=offset)


@router.get("/atms/{atm_id}")
def atm_detail(atm_id: str, db: Session = Depends(get_db)):
    out = queries.get_atm(db, atm_id)
    if out is None:
        raise HTTPException(404, f"ATM {atm_id} not found")
    return out


@router.get("/atms/{atm_id}/history", response_model=HistoryOut)
def atm_history(atm_id: str, start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    """Actual vs predicted demand. `dates` are the days the demand occurred (target day), `split` says whether
    each point was in the Train / Validation / Test period or is Live (unseen by the model)."""
    if db.get(Atm, atm_id) is None:
        raise HTTPException(404, f"ATM {atm_id} not found")
    return queries.history(db, atm_id, start, end)


@router.put("/atms/{atm_id}", dependencies=[Depends(require_api_key)])
def update_atm(atm_id: str, body: AtmUpdate, db: Session = Depends(get_db)):
    """Set location / vault capacity. A master capacity overrides the derived one."""
    atm = db.get(Atm, atm_id)
    if atm is None:
        raise HTTPException(404, f"ATM {atm_id} not found")
    if body.location is not None:
        atm.location = body.location
    if body.capacity is not None:
        atm.capacity, atm.capacity_source = body.capacity, "master"
    if body.active is not None:
        atm.active = body.active
    db.commit()
    _rebuild_status(db)
    return queries.get_atm(db, atm_id)


@router.post("/atms/master", dependencies=[Depends(require_api_key)])
async def upload_master(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """CSV with columns ATMID, Location, Capacity (Location/Capacity optional). Fixes the
    '(location not in dataset)' labels and replaces derived vault sizes with real ones."""
    try:
        out = ingest.ingest_master(db, ingest.read_csv_bytes(await file.read()))
    except ingest.IngestError as e:
        raise HTTPException(422, str(e))
    _rebuild_status(db)
    return out


def _rebuild_status(db: Session) -> None:
    try:
        status, as_of, run_id = build_status(db)
        persist_status(db, status, as_of, run_id)
    except NoData:
        pass

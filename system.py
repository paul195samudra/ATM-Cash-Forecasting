from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..db import get_db
from ..ml.registry import active_run
from ..models import Atm, Job, Withdrawal
from ..services import queries

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """Liveness + a quick look at what is loaded."""
    db.execute(text("SELECT 1"))
    run = active_run(db)
    return {
        "status": "ok",
        "atms": db.scalar(select(func.count()).select_from(Atm)),
        "withdrawal_rows": db.scalar(select(func.count()).select_from(Withdrawal)),
        "latest_snapshot": (queries.latest_snapshot_date(db) or None) and queries.latest_snapshot_date(db).isoformat(),
        "active_model": {"id": run.id, "name": run.name, "source": run.source} if run else None,
    }


@router.get("/data-quality")
def data_quality(db: Session = Depends(get_db)):
    """Holes in the history, ATMs that stopped reporting, ATMs too new to forecast with the model."""
    return queries.data_quality(db)


@router.get("/jobs")
def jobs(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.scalars(select(Job).order_by(Job.created_at.desc()).limit(min(limit, 100)))
    return [_job(j) for j in rows]


@router.get("/jobs/{job_id}")
def job(job_id: str, db: Session = Depends(get_db)):
    j = db.get(Job, job_id)
    if not j:
        raise HTTPException(404, "Unknown job id")
    return _job(j)


def _job(j: Job) -> dict:
    return {"id": j.id, "kind": j.kind, "status": j.status, "message": j.message, "result": j.result,
            "created_at": j.created_at, "started_at": j.started_at, "finished_at": j.finished_at}

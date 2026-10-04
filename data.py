from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..ml.registry import active_run
from ..schemas import WithdrawalsIn
from ..security import require_api_key
from ..services import ingest, jobs
from ..services.pipeline import refresh

router = APIRouter(prefix="/api/data", tags=["data"], dependencies=[Depends(require_api_key)])


@router.post("/upload")
async def upload_csvs(background: BackgroundTasks, files: list[UploadFile] = File(...), refresh_after: bool = True,
                      db: Session = Depends(get_db)):
    """Upload one or more raw CSVs (e.g. ATM_Featured_Dataset_JAN24_JUN24.csv + ..._JUL24_DEC24.csv).
    Needs columns ATMID, Date, Daily_Withdrawal; transaction columns are optional but recommended.
    Idempotent: re-uploading the same rows just overwrites them."""
    try:
        frames = [ingest.read_csv_bytes(await f.read()) for f in files]
        report = ingest.ingest_frames(db, frames)
    except ingest.IngestError as e:
        raise HTTPException(422, str(e))
    return _maybe_refresh(background, report, refresh_after, db)


@router.post("/withdrawals")
def push_withdrawals(body: WithdrawalsIn, background: BackgroundTasks, refresh_after: bool = True,
                     db: Session = Depends(get_db)):
    """JSON feed for a nightly integration: push yesterday's rows, get fresh forecasts + status."""
    import pandas as pd
    try:
        report = ingest.ingest_frames(db, [pd.DataFrame([r.model_dump() for r in body.rows])])
    except ingest.IngestError as e:
        raise HTTPException(422, str(e))
    return _maybe_refresh(background, report, refresh_after, db)


def _maybe_refresh(background: BackgroundTasks, report: dict, refresh_after: bool, db: Session) -> dict:
    if not refresh_after:
        return {"ingest": report, "job": None}
    if active_run(db) is None:
        return {"ingest": report, "job": None,
                "note": "Data saved. No active model yet - train one with POST /api/model/train to get forecasts."}
    if jobs.busy():
        return {"ingest": report, "job": None, "note": "Data saved, but a pipeline job is running; call POST /api/pipeline/refresh afterwards."}
    jid = jobs.create("refresh")
    background.add_task(jobs.run, jid, refresh)
    return {"ingest": report, "job": jid}

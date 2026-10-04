"""FastAPI application entrypoint:  uvicorn app.main:app --reload"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .db import init_db, session_scope
from .ml.registry import NoActiveModel
from .routers import atms, cash, data, model, system
from .services import ingest, jobs
from .services.pipeline import NoData, refresh

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("atm.app")
STATIC = Path(__file__).resolve().parent.parent / "static"


async def _auto_refresh(minutes: float) -> None:
    """Optional in-process scheduler (AUTO_REFRESH_MINUTES > 0). Prefer cron + `python -m app.cli refresh` in prod."""
    while True:
        await asyncio.sleep(minutes * 60)
        if jobs.busy():
            continue
        jid = jobs.create("refresh")
        await asyncio.to_thread(jobs.run, jid, refresh)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = None
    minutes = float(os.environ.get("AUTO_REFRESH_MINUTES", "0") or 0)
    if minutes > 0:
        task = asyncio.create_task(_auto_refresh(minutes))
    yield
    if task:
        task.cancel()


app = FastAPI(title="ATM Cash Management API", version="1.0.0", lifespan=lifespan,
              description="Backend for the ATM cash dashboard: ingestion, demand forecasting, cash position, "
                          "refill planning and model management.")
app.add_middleware(CORSMiddleware, allow_origins=list(get_settings().cors_origins), allow_methods=["*"], allow_headers=["*"])
for r in (system.router, atms.router, cash.router, data.router, model.router):
    app.include_router(r)


@app.exception_handler(NoActiveModel)
async def _no_model(_: Request, e: NoActiveModel):
    return JSONResponse(status_code=409, content={"detail": str(e)})


@app.exception_handler(NoData)
async def _no_data(_: Request, e: NoData):
    return JSONResponse(status_code=409, content={"detail": str(e)})


@app.exception_handler(ingest.IngestError)
async def _bad_data(_: Request, e: ingest.IngestError):
    return JSONResponse(status_code=422, content={"detail": str(e)})


if STATIC.exists():
    app.mount("/static", StaticFiles(directory=STATIC), name="static")

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(STATIC / "index.html")

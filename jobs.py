"""Tiny background-job runner with persisted status (enough for a single-node deployment)."""
from __future__ import annotations

import logging
import traceback
import uuid
from datetime import datetime, timezone
from typing import Callable

from ..db import session_scope
from ..models import Job
from .pipeline import PIPELINE_LOCK

log = logging.getLogger("atm.jobs")


def busy() -> bool:
    return PIPELINE_LOCK.locked()


def create(kind: str) -> str:
    jid = uuid.uuid4().hex[:12]
    with session_scope() as db:
        db.add(Job(id=jid, kind=kind, status="queued"))
    return jid


def run(jid: str, fn: Callable, **kwargs) -> None:
    """Execute fn(db, **kwargs) under the global pipeline lock, recording the outcome."""
    if not PIPELINE_LOCK.acquire(blocking=False):
        _finish(jid, "failed", message="Another pipeline job is already running.")
        return
    try:
        with session_scope() as db:
            j = db.get(Job, jid)
            j.status, j.started_at = "running", datetime.now(timezone.utc).replace(tzinfo=None)
        with session_scope() as db:
            result = fn(db, **kwargs)
        _finish(jid, "done", result=_jsonable(result))
    except Exception as e:  # noqa: BLE001 - job boundary: record everything
        log.error("job %s failed: %s", jid, traceback.format_exc())
        _finish(jid, "failed", message=f"{type(e).__name__}: {e}")
    finally:
        PIPELINE_LOCK.release()


def _jsonable(x):
    import json
    return json.loads(json.dumps(x, default=str))


def _finish(jid: str, status: str, message: str | None = None, result=None) -> None:
    with session_scope() as db:
        j = db.get(Job, jid)
        if j is None:
            return
        j.status, j.message, j.result, j.finished_at = status, message, result, datetime.now(timezone.utc).replace(tzinfo=None)

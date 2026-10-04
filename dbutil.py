"""Portable bulk upsert (SQLite + PostgreSQL) and small DataFrame <-> DB helpers."""
from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session


def _clean(v):
    if v is None:
        return None
    if isinstance(v, float) and np.isnan(v):
        return None
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, np.integer):
        return int(v)
    if isinstance(v, np.bool_):
        return bool(v)
    if isinstance(v, pd.Timestamp):
        return v.date()
    if v is pd.NaT:
        return None
    return v


def upsert(db: Session, model, rows: Iterable[dict], key_cols: list[str], chunk: int = 2000) -> int:
    """INSERT ... ON CONFLICT (key) DO UPDATE for every non-key column present in the rows."""
    rows = [{k: _clean(v) for k, v in r.items()} for r in rows]
    if not rows:
        return 0
    keys = list(dict.fromkeys(k for r in rows for k in r))      # multi-row INSERT needs identical keys
    rows = [{k: r.get(k) for k in keys} for r in rows]
    dialect = db.get_bind().dialect.name
    if dialect == "sqlite":
        from sqlalchemy.dialects.sqlite import insert
    elif dialect == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    else:  # generic, slow path
        for r in rows:
            db.merge(model(**r))
        return len(rows)
    update_cols = [c for c in rows[0] if c not in key_cols]
    for i in range(0, len(rows), chunk):
        part = rows[i:i + chunk]
        stmt = insert(model).values(part)
        if update_cols:
            stmt = stmt.on_conflict_do_update(index_elements=key_cols, set_={c: stmt.excluded[c] for c in update_cols})
        else:
            stmt = stmt.on_conflict_do_nothing(index_elements=key_cols)
        db.execute(stmt)
    return len(rows)

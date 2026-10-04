"""Optional API-key protection for write endpoints (set API_KEY in the environment)."""
from __future__ import annotations

import hmac

from fastapi import Header, HTTPException

from .config import get_settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    key = get_settings().api_key
    if key and not hmac.compare_digest((x_api_key or "").encode(), key.encode()):
        raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key header.")

"""Shared request validation helpers for the BizScrape API."""

from __future__ import annotations

import re
import uuid

from bizscrape.api import error_codes as codes
from bizscrape.api.errors import ApiError

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_MULTI_SPACE = re.compile(r"\s+")


def normalize_user_text(value: str) -> str:
    """Strip, collapse whitespace, and reject control characters."""
    if not isinstance(value, str):
        raise ValueError("must be a string")
    if _CONTROL_CHARS.search(value):
        raise ValueError("contains invalid characters")
    normalized = _MULTI_SPACE.sub(" ", value.strip())
    if not normalized:
        raise ValueError("must not be empty")
    return normalized


def parse_job_id(job_id: str) -> str:
    """Validate that *job_id* is a UUID string."""
    candidate = (job_id or "").strip()
    if not candidate:
        raise ApiError(
            codes.INVALID_JOB_ID,
            codes.user_message(codes.INVALID_JOB_ID),
            status_code=400,
            retryable=False,
        )
    try:
        parsed = uuid.UUID(candidate)
    except ValueError as exc:
        raise ApiError(
            codes.INVALID_JOB_ID,
            codes.user_message(codes.INVALID_JOB_ID),
            status_code=400,
            retryable=False,
        ) from exc
    return str(parsed)

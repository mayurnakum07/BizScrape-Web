"""Simple in-process rate limiting for abuse-prone API routes."""

from __future__ import annotations

import threading
import time
from collections import defaultdict

from bizscrape.api import error_codes as codes
from bizscrape.api.errors import ApiError


class RateLimiter:
    """Fixed-window counter keyed by client + route."""

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, *, limit: int, window_seconds: float) -> None:
        if limit <= 0:
            return
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            hits = [stamp for stamp in self._hits[key] if stamp > cutoff]
            if len(hits) >= limit:
                raise ApiError(
                    codes.RATE_LIMITED,
                    "Too many requests. Please wait a moment and try again.",
                    status_code=429,
                    retryable=True,
                )
            hits.append(now)
            self._hits[key] = hits


_limiter = RateLimiter()


def reset_rate_limiter() -> None:
    """Test helper — clears in-process counters."""
    _limiter._hits.clear()


def client_key(request) -> str:  # type: ignore[no-untyped-def]
    client = getattr(request, "client", None)
    host = getattr(client, "host", None) if client else None
    return host or "unknown"


def enforce_rate_limit(request, *, route: str, limit: int, window_seconds: float = 60.0) -> None:
    _limiter.check(f"{route}:{client_key(request)}", limit=limit, window_seconds=window_seconds)

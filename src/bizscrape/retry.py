"""Bounded retries with exponential backoff for transient failures."""

from __future__ import annotations

import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")

# Exceptions that are usually worth retrying.
TRANSIENT_EXC = (
    TimeoutError,
    ConnectionError,
    OSError,
)


def is_transient(exc: BaseException) -> bool:
    name = type(exc).__name__
    if isinstance(exc, TRANSIENT_EXC):
        return True
    # httpx / playwright style names without hard dependency here
    if name in {
        "ConnectTimeout",
        "ReadTimeout",
        "WriteTimeout",
        "PoolTimeout",
        "NetworkError",
        "RemoteProtocolError",
        "TimeoutError",
    }:
        return True
    message = str(exc).lower()
    return any(
        token in message
        for token in ("timed out", "timeout", "temporar", "connection reset", "try again")
    )


async def async_retry(
    func: Callable[[], Awaitable[T]],
    *,
    attempts: int = 3,
    base_delay: float = 0.6,
    max_delay: float = 8.0,
    retry_if: Callable[[BaseException], bool] | None = None,
) -> T:
    """Run *func* up to *attempts* times with jittered exponential backoff."""
    predicate = retry_if or is_transient
    last: BaseException | None = None
    for attempt in range(1, max(1, attempts) + 1):
        try:
            return await func()
        except asyncio.CancelledError:
            raise
        except BaseException as exc:  # noqa: BLE001 - classified below
            last = exc
            if attempt >= attempts or not predicate(exc):
                raise
            delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
            delay *= random.uniform(0.7, 1.3)
            await asyncio.sleep(delay)
    assert last is not None
    raise last

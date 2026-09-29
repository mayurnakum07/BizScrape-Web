"""Per-job SSE event bus with bounded replay buffer."""

from __future__ import annotations

import asyncio
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any

TERMINAL_EVENT_TYPES = frozenset(
    {
        "job_completed",
        "job_failed",
        "job_cancelled",
    }
)

# Keep memory bounded for long scrapes.
DEFAULT_BUFFER_SIZE = 500


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class JobEventBus:
    """Thread-safe event buffer + live fan-out for one job."""

    def __init__(self, job_id: str, *, maxlen: int = DEFAULT_BUFFER_SIZE) -> None:
        self.job_id = job_id
        self._maxlen = maxlen
        self._seq = 0
        self._buffer: deque[dict[str, Any]] = deque(maxlen=maxlen)
        self._subscribers: list[asyncio.Queue[dict[str, Any] | None]] = []
        self._lock = threading.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None
        self.closed = False

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def publish(self, event_type: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = dict(data or {})
        with self._lock:
            self._seq += 1
            event = {
                "id": str(self._seq),
                "type": event_type,
                "jobId": self.job_id,
                "timestamp": utc_now_iso(),
                "data": payload,
            }
            self._buffer.append(event)
            subscribers = list(self._subscribers)
            if event_type in TERMINAL_EVENT_TYPES:
                self.closed = True

        for queue in subscribers:
            self._enqueue(queue, event)
            if event_type in TERMINAL_EVENT_TYPES:
                self._enqueue(queue, None)  # end-of-stream sentinel
        return event

    def subscribe(
        self,
        last_event_id: str | None = None,
    ) -> tuple[asyncio.Queue[dict[str, Any] | None], list[dict[str, Any]]]:
        """
        Return (live_queue, replayed_events).

        Replayed events are those with id > last_event_id (numeric).
        """
        queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue(maxsize=256)
        with self._lock:
            replay = self._events_after_locked(last_event_id)
            self._subscribers.append(queue)
            closed = self.closed
            # If already terminal and nothing new to stream after replay, close.
            if closed and not replay:
                # Still allow subscriber to receive sentinel after replay empty.
                pass

        if closed and not replay:
            self._enqueue(queue, None)
        elif closed and replay and replay[-1]["type"] in TERMINAL_EVENT_TYPES:
            # Replay includes terminal - SSE handler will close after draining replay.
            pass

        return queue, replay

    def unsubscribe(self, queue: asyncio.Queue[dict[str, Any] | None]) -> None:
        with self._lock:
            if queue in self._subscribers:
                self._subscribers.remove(queue)

    def snapshot(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._buffer)

    def events_after(self, last_event_id: str | None) -> list[dict[str, Any]]:
        with self._lock:
            return self._events_after_locked(last_event_id)

    def _events_after_locked(self, last_event_id: str | None) -> list[dict[str, Any]]:
        if not last_event_id:
            return list(self._buffer)
        try:
            last = int(last_event_id)
        except ValueError:
            return list(self._buffer)
        return [event for event in self._buffer if int(event["id"]) > last]

    def _enqueue(
        self,
        queue: asyncio.Queue[dict[str, Any] | None],
        item: dict[str, Any] | None,
    ) -> None:
        loop = self._loop
        if loop is not None and loop.is_running():

            def _put() -> None:
                try:
                    queue.put_nowait(item)
                except asyncio.QueueFull:
                    # Drop oldest live event under backpressure; buffer still has history.
                    try:
                        queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                    try:
                        queue.put_nowait(item)
                    except asyncio.QueueFull:
                        pass

            loop.call_soon_threadsafe(_put)
        else:
            try:
                queue.put_nowait(item)
            except asyncio.QueueFull:
                pass

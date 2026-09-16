"""SSE stream for live scrape job events."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import StreamingResponse

from bizscrape.api import error_codes as codes
from bizscrape.api.deps import get_job_manager, validated_job_id
from bizscrape.api.errors import ApiError
from bizscrape.api.events import TERMINAL_EVENT_TYPES
from bizscrape.api.jobs.manager import JobManager

logger = logging.getLogger("bizscrape.api.routes.events")

router = APIRouter(prefix="/jobs", tags=["events"])

KEEPALIVE_SECONDS = 15


def _sse_pack(event: dict) -> str:
    return f"id: {event['id']}\ndata: {json.dumps(event, separators=(',', ':'))}\n\n"


@router.get("/{job_id}/events")
async def stream_job_events(
    request: Request,
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
) -> StreamingResponse:
    job = manager.get_job(job_id)
    if not job:
        raise ApiError(
            codes.JOB_NOT_FOUND,
            codes.user_message(codes.JOB_NOT_FOUND),
            status_code=404,
            job_id=job_id,
        )

    # Prefer header (native EventSource reconnect); fall back to query for first open.
    query_last = request.query_params.get("lastEventId")
    resume_from = last_event_id or query_last

    bus, queue, replay = manager.subscribe_events(job_id, resume_from)

    async def generate() -> AsyncIterator[str]:
        try:
            for event in replay:
                if await request.is_disconnected():
                    return
                yield _sse_pack(event)
                if event.get("type") in TERMINAL_EVENT_TYPES:
                    return

            while True:
                if await request.is_disconnected():
                    return
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=KEEPALIVE_SECONDS)
                except asyncio.TimeoutError:
                    # SSE comment — not a user-facing event.
                    yield ": keepalive\n\n"
                    # If job finished but we missed the sentinel, exit cleanly.
                    current = manager.get_job(job_id)
                    if current and current.get("status") in (
                        "completed",
                        "failed",
                        "cancelled",
                    ):
                        if bus.closed:
                            return
                    continue

                if item is None:
                    return
                yield _sse_pack(item)
                if item.get("type") in TERMINAL_EVENT_TYPES:
                    return
        finally:
            bus.unsubscribe(queue)
            logger.info("sse_closed job_id=%s", job_id)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

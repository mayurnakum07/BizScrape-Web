"""In-process scrape job manager with SSE event fan-out."""

from __future__ import annotations

import asyncio
import logging
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable

from bizscrape.api import error_codes as codes
from bizscrape.api.error_codes import classify_exception, classified_to_dict
from bizscrape.api.errors import ApiError
from bizscrape.api.events import JobEventBus, TERMINAL_EVENT_TYPES
from bizscrape.api.jobs.repository import InMemoryJobRepository, JobRepository
from bizscrape.api.models import CreateJobRequest
from bizscrape.api.settings import Settings, get_settings
from bizscrape.engine import ScrapeRunConfig, run_scrape
from bizscrape.shutdown import JobCancelled

logger = logging.getLogger("bizscrape.api.jobs")

PIPELINE_STAGES = (
    "discover",
    "website_lookup",
    "enrich",
    "deduplicate",
    "export",
)

RunScrapeFn = Callable[..., Awaitable[Any]]

# Engine raw types we map into the public SSE envelope.
_ENGINE_TO_PUBLIC = {
    "progress": "stage_progress",  # legacy alias
}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _initial_stages() -> dict[str, str]:
    return {stage: "pending" for stage in PIPELINE_STAGES}


def _empty_stats() -> dict[str, int]:
    return {
        "businessesFound": 0,
        "localMatches": 0,
        "websitesResolved": 0,
        "emailsFound": 0,
        "phonesFound": 0,
        "duplicatesRemoved": 0,
    }


class JobManager:
    def __init__(
        self,
        repository: JobRepository | None = None,
        settings: Settings | None = None,
        run_scrape_fn: RunScrapeFn | None = None,
    ) -> None:
        self.repository = repository or InMemoryJobRepository()
        self.settings = settings or get_settings()
        self._run_scrape = run_scrape_fn or run_scrape
        self._tasks: dict[str, asyncio.Task[None]] = {}
        self._cancel_flags: dict[str, threading.Event] = {}
        self._buses: dict[str, JobEventBus] = {}
        self._lock = asyncio.Lock()
        self._running = 0

    async def shutdown(self) -> None:
        for job_id, flag in list(self._cancel_flags.items()):
            flag.set()
            logger.info("shutdown_cancel job_id=%s", job_id)
        tasks = list(self._tasks.values())
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def create_job(self, request: CreateJobRequest) -> str:
        active = self._count_active()
        queued = self._count_queued()
        if (
            active >= self.settings.max_concurrent_jobs
            and queued >= self.settings.max_queued_jobs
        ):
            raise ApiError(
                codes.JOB_CAPACITY,
                codes.user_message(codes.JOB_CAPACITY),
                status_code=429,
                retryable=True,
            )

        job_id = str(uuid.uuid4())
        now = _utcnow()
        out_dir = Path(self.settings.job_data_dir) / job_id
        out_dir.mkdir(parents=True, exist_ok=True)
        csv_path = str(out_dir / "results.csv")

        record = {
            "id": job_id,
            "provider": "remote",
            "config": {
                "businessType": request.businessType,
                "country": request.country or "",
                "state": request.state or "",
                "city": request.city,
                "area": request.area,
                "target": request.target,
                "sources": list(request.sources),
                "searchAllLocalities": request.searchAllLocalities,
            },
            "status": "queued",
            "connection": "connected",
            "currentStage": None,
            "stages": _initial_stages(),
            "progress": {
                "mode": "stage",
                "percent": 0,
                "stageIndex": 0,
                "stageCount": len(PIPELINE_STAGES),
            },
            "targetProgress": {"collected": 0, "target": request.target},
            "stats": _empty_stats(),
            "activity": [],
            "operationMessage": "Queued…",
            "csvReady": False,
            "csvPath": csv_path,
            "error": None,
            "records": [],
            "partialResults": False,
            "retryCount": 0,
            "retryOfJobId": None,
            "createdAt": now,
            "updatedAt": now,
            "lastEventId": None,
        }
        self.repository.create(job_id, record)
        self._buses[job_id] = JobEventBus(job_id)
        self._publish(
            job_id,
            "job_queued",
            {"message": "Job created and queued"},
            apply_state=False,
        )
        self._append_activity(job_id, "Job created and queued")
        logger.info(
            "job_created job_id=%s city=%s niche=%s target=%s",
            job_id,
            request.city,
            request.businessType,
            request.target,
        )
        return job_id

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        return self.repository.get(job_id)

    def get_event_bus(self, job_id: str) -> JobEventBus | None:
        return self._buses.get(job_id)

    def subscribe_events(
        self,
        job_id: str,
        last_event_id: str | None = None,
    ) -> tuple[JobEventBus, asyncio.Queue[dict[str, Any] | None], list[dict[str, Any]]]:
        job = self.repository.get(job_id)
        if not job:
            raise ApiError(
                codes.JOB_NOT_FOUND,
                codes.user_message(codes.JOB_NOT_FOUND),
                status_code=404,
                job_id=job_id,
            )
        bus = self._buses.get(job_id)
        if bus is None:
            bus = JobEventBus(job_id)
            self._buses[job_id] = bus
            # Terminal job without bus - synthesize a terminal event for late subscribers.
            status = job.get("status")
            if status == "completed":
                bus.publish("job_completed", {"status": "completed"})
            elif status == "failed":
                error = job.get("error") or {}
                bus.publish(
                    "job_failed",
                    {
                        "code": error.get("code", "SCRAPE_FAILED"),
                        "message": error.get("message", "Scraping failed."),
                        "stage": error.get("stage"),
                        "retryable": bool(error.get("retryable", True)),
                    },
                )
            elif status == "cancelled":
                bus.publish("job_cancelled", {"status": "cancelled"})
        try:
            loop = asyncio.get_running_loop()
            bus.bind_loop(loop)
        except RuntimeError:
            pass
        queue, replay = bus.subscribe(last_event_id)
        return bus, queue, replay

    def schedule(self, job_id: str) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        bus = self._buses.get(job_id)
        if bus:
            bus.bind_loop(loop)
        loop.create_task(self._maybe_start(job_id))

    async def _maybe_start(self, job_id: str) -> None:
        async with self._lock:
            job = self.repository.get(job_id)
            if not job or job["status"] not in ("queued",):
                return
            if self._running >= self.settings.max_concurrent_jobs:
                return
            if job_id in self._tasks:
                return
            self._running += 1
            cancel_flag = threading.Event()
            self._cancel_flags[job_id] = cancel_flag
            bus = self._buses.get(job_id)
            if bus:
                bus.bind_loop(asyncio.get_running_loop())
            task = asyncio.create_task(self._execute(job_id, cancel_flag))
            self._tasks[job_id] = task
            task.add_done_callback(lambda _t, jid=job_id: self._on_task_done(jid))

    def _on_task_done(self, job_id: str) -> None:
        self._tasks.pop(job_id, None)
        self._cancel_flags.pop(job_id, None)
        self._running = max(0, self._running - 1)
        for queued_id in self.repository.list_ids():
            job = self.repository.get(queued_id)
            if job and job["status"] == "queued":
                self.schedule(queued_id)
                break

    async def _execute(self, job_id: str, cancel_flag: threading.Event) -> None:
        job = self.repository.get(job_id)
        if not job:
            return

        self._patch(
            job_id,
            {
                "status": "starting",
                "operationMessage": "Starting scrape pipeline…",
            },
        )
        self._append_activity(job_id, "Pipeline starting")

        cfg = job["config"]
        city_parts = [
            str(cfg.get("city") or "").strip(),
            str(cfg.get("state") or "").strip(),
            str(cfg.get("country") or "").strip(),
        ]
        engine_city = ", ".join(part for part in city_parts if part)
        run_cfg = ScrapeRunConfig(
            business_type=cfg["businessType"],
            city=engine_city or cfg["city"],
            area=cfg.get("area"),
            target=int(cfg["target"]),
            sources=list(cfg.get("sources") or ["gmaps"]),
            search_all_localities=bool(cfg.get("searchAllLocalities")),
            out=job["csvPath"],
        )

        def on_event(event: dict[str, Any]) -> None:
            self._handle_engine_event(job_id, event)

        self._patch(
            job_id,
            {
                "status": "running",
                "operationMessage": "Scraping in progress…",
            },
        )

        try:
            result = await self._run_scrape(
                run_cfg,
                event_callback=on_event,
                cancel_flag=cancel_flag,
            )
        except JobCancelled:
            self._finalize_cancelled(job_id, records=[])
            return
        except Exception as exc:
            stage = self._current_stage(job_id)
            logger.exception(
                "job_failed job_id=%s stage=%s error_type=%s",
                job_id,
                stage,
                type(exc).__name__,
            )
            job_now = self.repository.get(job_id) or job
            records = list(job_now.get("records") or [])
            classified = classify_exception(exc, stage=stage)
            # Preserve partial discoveries when later stages fail.
            partial = len(records) > 0 and stage in (
                "website_lookup",
                "enrich",
                "deduplicate",
                "export",
            )
            error = classified_to_dict(
                classified,
                job_id=job_id,
                partial=partial,
                records_collected=len(records),
            )
            # Flatten for JobErrorModel fields used by the frontend.
            job_error = {
                "code": error["code"],
                "message": error["message"],
                "stage": error.get("stage"),
                "retryable": error["retryable"],
                "details": error.get("details"),
            }
            stages = dict(job_now.get("stages") or _initial_stages())
            if stage in stages:
                stages[stage] = "failed"
            self._patch(
                job_id,
                {
                    "status": "failed",
                    "operationMessage": (
                        "Partial results available."
                        if partial
                        else "Scraping failed."
                    ),
                    "error": job_error,
                    "records": records,
                    "partialResults": partial,
                    "stages": stages,
                    "csvReady": partial and len(records) > 0,
                },
            )
            self._publish(job_id, "job_failed", error)
            return

        if result.cancelled or cancel_flag.is_set():
            self._finalize_cancelled(job_id, records=result.records, stats=result.stats)
            return

        stats = self._stats_from_engine(result.stats, job)
        # Always persist engine records on the job (authoritative final set).
        self._patch(
            job_id,
            {
                "records": result.records,
                "stats": stats,
                "targetProgress": {
                    "collected": result.stats.get("total", len(result.records)),
                    "target": job["config"]["target"],
                },
                "csvReady": True,
                "csvPath": result.csv_path or job["csvPath"],
                "error": None,
            },
        )
        job_now = self.repository.get(job_id) or job
        if job_now.get("status") != "completed":
            self._patch(
                job_id,
                {
                    "status": "completed",
                    "currentStage": None,
                    "stages": {s: "completed" for s in PIPELINE_STAGES},
                    "progress": {
                        "mode": "stage",
                        "percent": 100,
                        "stageIndex": len(PIPELINE_STAGES),
                        "stageCount": len(PIPELINE_STAGES),
                    },
                    "operationMessage": "Scrape complete.",
                },
            )
            self._publish(
                job_id,
                "results_updated",
                {"count": len(result.records), "records": result.records},
            )
            self._publish(job_id, "csv_ready", {"count": len(result.records)})
            self._publish(
                job_id,
                "job_completed",
                {"count": len(result.records), "status": "completed"},
            )
        logger.info(
            "job_completed job_id=%s records=%s",
            job_id,
            len(result.records),
        )

    def _finalize_cancelled(
        self,
        job_id: str,
        *,
        records: list[dict[str, Any]],
        stats: dict[str, int] | None = None,
    ) -> None:
        job = self.repository.get(job_id) or {}
        patch: dict[str, Any] = {
            "status": "cancelled",
            "currentStage": None,
            "operationMessage": "Scraping cancelled.",
            "csvReady": bool(records),
            "records": records,
            "partialResults": bool(records),
        }
        if stats is not None:
            patch["stats"] = self._stats_from_engine(stats, job)
            patch["targetProgress"] = {
                "collected": stats.get("total", len(records)),
                "target": (job.get("config") or {}).get("target", 0),
            }
        self._patch(job_id, patch)
        # Avoid duplicate terminal if engine already published job_cancelled.
        bus = self._buses.get(job_id)
        if bus and not bus.closed:
            self._publish(job_id, "job_cancelled", {"status": "cancelled"})
        logger.info("job_cancelled job_id=%s", job_id)

    def cancel_job(self, job_id: str) -> dict[str, Any]:
        job = self.repository.get(job_id)
        if not job:
            raise ApiError(
                codes.JOB_NOT_FOUND,
                codes.user_message(codes.JOB_NOT_FOUND),
                status_code=404,
                job_id=job_id,
            )

        if job["status"] in ("completed", "failed", "cancelled"):
            return job

        if job["status"] == "cancelling":
            raise ApiError(
                codes.JOB_CANCEL_IN_PROGRESS,
                codes.user_message(codes.JOB_CANCEL_IN_PROGRESS),
                status_code=409,
                retryable=False,
                job_id=job_id,
            )

        flag = self._cancel_flags.get(job_id)
        if flag is not None:
            flag.set()

        if job["status"] == "queued":
            self._patch(
                job_id,
                {
                    "status": "cancelled",
                    "operationMessage": "Scraping cancelled.",
                    "currentStage": None,
                    "partialResults": bool(job.get("records")),
                },
            )
            self._publish(job_id, "job_cancelled", {"status": "cancelled"})
        else:
            self._patch(
                job_id,
                {
                    "status": "cancelling",
                    "operationMessage": (
                        "Stopping scraper… Cleaning up the running browser process."
                    ),
                },
            )
            self._publish(
                job_id,
                "stage_progress",
                {"message": "Cancel requested", "status": "cancelling"},
            )
            self._append_activity(
                job_id,
                "Cancel requested - stopping scraper…",
                job.get("currentStage"),
            )
            self._schedule_cancel_watchdog(job_id)

        updated = self.repository.get(job_id)
        assert updated is not None
        logger.info(
            "job_cancel_requested job_id=%s status=%s",
            job_id,
            updated["status"],
        )
        return updated

    def _schedule_cancel_watchdog(self, job_id: str) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        timeout = self.settings.cancel_timeout_seconds

        async def _watch() -> None:
            await asyncio.sleep(timeout)
            job = self.repository.get(job_id)
            if not job or job.get("status") != "cancelling":
                return
            logger.warning(
                "cancel_timeout job_id=%s timeout_s=%s forcing_terminal",
                job_id,
                timeout,
            )
            flag = self._cancel_flags.get(job_id)
            if flag is not None:
                flag.set()
            records = list(job.get("records") or [])
            self._finalize_cancelled(job_id, records=records)
            task = self._tasks.get(job_id)
            if task and not task.done():
                task.cancel()

        loop.create_task(_watch())

    def retry_job(self, job_id: str) -> str:
        """Create a fresh job from a failed/cancelled job's config (new ID)."""
        job = self.repository.get(job_id)
        if not job:
            raise ApiError(
                codes.JOB_NOT_FOUND,
                codes.user_message(codes.JOB_NOT_FOUND),
                status_code=404,
                job_id=job_id,
            )

        status = job.get("status")
        if status not in ("failed", "cancelled"):
            raise ApiError(
                codes.JOB_NOT_RETRYABLE,
                "Only failed or cancelled jobs can be retried.",
                status_code=409,
                retryable=False,
                job_id=job_id,
            )

        error = job.get("error") or {}
        if status == "failed" and error.get("retryable") is False:
            raise ApiError(
                codes.JOB_NOT_RETRYABLE,
                codes.user_message(codes.JOB_NOT_RETRYABLE),
                status_code=409,
                retryable=False,
                job_id=job_id,
            )

        retry_count = int(job.get("retryCount") or 0)
        if retry_count >= self.settings.max_job_retries:
            raise ApiError(
                codes.JOB_RETRY_LIMIT,
                codes.user_message(codes.JOB_RETRY_LIMIT),
                status_code=429,
                retryable=False,
                job_id=job_id,
            )

        cfg = job["config"]
        request = CreateJobRequest(
            businessType=cfg["businessType"],
            country=str(cfg.get("country") or ""),
            state=str(cfg.get("state") or ""),
            city=cfg["city"],
            area=cfg.get("area"),
            target=int(cfg["target"]),
            sources=list(cfg.get("sources") or ["gmaps"]),
            searchAllLocalities=bool(cfg.get("searchAllLocalities")),
        )
        new_id = self.create_job(request)
        self.repository.update(
            new_id,
            {
                "retryCount": retry_count + 1,
                "retryOfJobId": job_id,
            },
        )
        logger.info(
            "job_retry source_job_id=%s new_job_id=%s attempt=%s",
            job_id,
            new_id,
            retry_count + 1,
        )
        return new_id

    def _handle_engine_event(self, job_id: str, event: dict[str, Any]) -> None:
        job = self.repository.get(job_id)
        if not job:
            return
        if job["status"] in ("cancelled", "failed", "completed"):
            return

        raw_type = str(event.get("type") or "")
        # Skip noisy raw logs from SSE; keep pipeline useful.
        if raw_type == "log":
            message = str(event.get("message") or "")[:200]
            if message:
                self._append_activity(job_id, message, event.get("stage"))
            return

        public_type = _ENGINE_TO_PUBLIC.get(raw_type, raw_type)
        data = {k: v for k, v in event.items() if k != "type"}

        # Update authoritative job state, then publish SSE envelope.
        self._apply_public_event(job_id, public_type, data)
        self._publish(job_id, public_type, data, apply_state=False)

    def _apply_public_event(
        self, job_id: str, etype: str, data: dict[str, Any]
    ) -> None:
        job = self.repository.get(job_id)
        if not job:
            return

        terminal_status = job["status"] in ("cancelled", "failed", "completed")
        if terminal_status and etype not in TERMINAL_EVENT_TYPES and etype != "csv_ready":
            return

        patch: dict[str, Any] = {}
        activity: str | None = None
        stage = data.get("stage")

        if etype == "job_started":
            patch.update(
                {
                    "status": "running",
                    "operationMessage": "Scraping started…",
                }
            )
            activity = "Scraping started"
        elif etype == "stage_started" and stage in PIPELINE_STAGES:
            stages = dict(job["stages"])
            for name, status in list(stages.items()):
                if status == "active":
                    stages[name] = "completed"
            stages[stage] = "active"
            idx = PIPELINE_STAGES.index(stage)
            patch.update(
                {
                    "currentStage": stage,
                    "stages": stages,
                    "status": "running" if job["status"] != "cancelling" else "cancelling",
                    "progress": {
                        "mode": "stage",
                        "percent": round((idx / len(PIPELINE_STAGES)) * 100, 1),
                        "stageIndex": idx,
                        "stageCount": len(PIPELINE_STAGES),
                    },
                    "operationMessage": f"Running {str(stage).replace('_', ' ')}…",
                }
            )
            activity = {
                "discover": "Discovering local businesses",
                "website_lookup": "Looking up websites",
                "enrich": "Enriching contact details",
                "deduplicate": "Removing duplicates",
                "export": "Preparing CSV export",
            }.get(str(stage), f"Stage started: {stage}")
        elif etype == "stage_completed" and stage in PIPELINE_STAGES:
            stages = dict(job["stages"])
            stages[stage] = "completed"
            patch["stages"] = stages
            activity = f"Completed {str(stage).replace('_', ' ')}"
        elif etype == "stage_progress":
            stored = int(data.get("stored") or job["targetProgress"]["collected"])
            emails = int(data.get("emails") or job["stats"]["emailsFound"])
            stats = dict(job["stats"])
            stats["businessesFound"] = max(stats["businessesFound"], stored)
            stats["emailsFound"] = max(stats["emailsFound"], emails)
            patch["stats"] = stats
            patch["targetProgress"] = {
                "collected": stored,
                "target": job["config"]["target"],
            }
            if data.get("stage_label"):
                patch["operationMessage"] = str(data["stage_label"])
        elif etype == "business_found":
            count = int(data.get("count") or 0)
            stats = dict(job["stats"])
            stats["businessesFound"] = count
            stats["localMatches"] = int(
                data.get("kept") or stats["localMatches"] or count
            )
            patch["stats"] = stats
            patch["targetProgress"] = {
                "collected": count,
                "target": job["config"]["target"],
            }
            activity = f"Found {count} businesses"
        elif etype == "website_found":
            count = int(data.get("count") or 0)
            stats = dict(job["stats"])
            stats["websitesResolved"] = count
            patch["stats"] = stats
            activity = f"{count} websites resolved"
        elif etype == "email_found":
            count = int(data.get("count") or 0)
            stats = dict(job["stats"])
            stats["emailsFound"] = count
            patch["stats"] = stats
            activity = f"{count} emails found"
        elif etype == "phone_found":
            count = int(data.get("count") or 0)
            stats = dict(job["stats"])
            stats["phonesFound"] = count
            patch["stats"] = stats
            activity = f"{count} phones found"
        elif etype == "results_updated":
            records = data.get("records")
            if isinstance(records, list):
                patch["records"] = records
                patch["targetProgress"] = {
                    "collected": len(records),
                    "target": job["config"]["target"],
                }
        elif etype == "csv_ready":
            patch["csvReady"] = True
            activity = "CSV ready"
        elif etype == "job_completed":
            patch.update(
                {
                    "status": "completed",
                    "currentStage": None,
                    "stages": {s: "completed" for s in PIPELINE_STAGES},
                    "progress": {
                        "mode": "stage",
                        "percent": 100,
                        "stageIndex": len(PIPELINE_STAGES),
                        "stageCount": len(PIPELINE_STAGES),
                    },
                    "operationMessage": "Scrape complete.",
                    "csvReady": True,
                    "error": None,
                }
            )
            if isinstance(data.get("records"), list):
                patch["records"] = data["records"]
            activity = "Job completed"
        elif etype == "job_failed":
            records = list(job.get("records") or [])
            partial = len(records) > 0
            patch.update(
                {
                    "status": "failed",
                    "operationMessage": (
                        "Partial results available."
                        if partial
                        else "Scraping failed."
                    ),
                    "partialResults": partial,
                    "csvReady": partial,
                    "error": {
                        "code": data.get("code", "SCRAPE_FAILED"),
                        "message": data.get(
                            "message", "Scraping failed. Check the server logs."
                        ),
                        "stage": data.get("stage"),
                        "retryable": bool(data.get("retryable", True)),
                        "details": data.get("details"),
                    },
                }
            )
            activity = "Job failed"
        elif etype == "job_cancelled":
            records = list(job.get("records") or [])
            patch.update(
                {
                    "status": "cancelled",
                    "currentStage": None,
                    "operationMessage": "Scraping cancelled.",
                    "csvReady": bool(records),
                    "partialResults": bool(records),
                }
            )
            activity = "Job cancelled"

        if patch:
            self._patch(job_id, patch)
        if activity:
            self._append_activity(
                job_id,
                activity,
                stage if isinstance(stage, str) else job.get("currentStage"),
            )

    def _publish(
        self,
        job_id: str,
        event_type: str,
        data: dict[str, Any] | None = None,
        *,
        apply_state: bool = True,
    ) -> dict[str, Any] | None:
        if apply_state:
            self._apply_public_event(job_id, event_type, dict(data or {}))
        bus = self._buses.get(job_id)
        if not bus:
            return None
        # Avoid double-terminal publish.
        if event_type in TERMINAL_EVENT_TYPES and bus.closed:
            return None
        event = bus.publish(event_type, data)
        self.repository.update(job_id, {"lastEventId": event["id"]})
        logger.info(
            "event job_id=%s type=%s event_id=%s",
            job_id,
            event_type,
            event["id"],
        )
        return event

    def _patch(self, job_id: str, patch: dict[str, Any]) -> None:
        job = self.repository.get(job_id)
        if not job:
            return
        next_patch = dict(patch)
        next_patch["updatedAt"] = _utcnow()
        self.repository.update(job_id, next_patch)

    def _append_activity(
        self, job_id: str, message: str, stage: str | None = None
    ) -> None:
        job = self.repository.get(job_id)
        if not job:
            return
        now = _utcnow()
        entries = list(job.get("activity") or [])
        entries.append(
            {
                "id": f"{job_id}-a{len(entries)+1}",
                "timestamp": now,
                "stage": stage or job.get("currentStage"),
                "message": message,
            }
        )
        self.repository.update(
            job_id,
            {"activity": entries[-40:], "updatedAt": now},
        )

    def _current_stage(self, job_id: str) -> str | None:
        job = self.repository.get(job_id)
        if not job:
            return None
        return job.get("currentStage")

    @staticmethod
    def _stats_from_engine(
        engine_stats: dict[str, int], job: dict[str, Any]
    ) -> dict[str, int]:
        prev = dict(job.get("stats") or _empty_stats())
        return {
            "businessesFound": int(engine_stats.get("total", prev["businessesFound"])),
            "localMatches": int(engine_stats.get("total", prev["localMatches"])),
            "websitesResolved": int(
                engine_stats.get("with_website", prev["websitesResolved"])
            ),
            "emailsFound": int(engine_stats.get("with_email", prev["emailsFound"])),
            "phonesFound": int(engine_stats.get("with_phone", prev["phonesFound"])),
            "duplicatesRemoved": int(prev.get("duplicatesRemoved") or 0),
        }

    def _count_active(self) -> int:
        count = 0
        for job_id in self.repository.list_ids():
            job = self.repository.get(job_id)
            if job and job["status"] in ("starting", "running", "cancelling"):
                count += 1
        return count

    def _count_queued(self) -> int:
        count = 0
        for job_id in self.repository.list_ids():
            job = self.repository.get(job_id)
            if job and job["status"] == "queued":
                count += 1
        return count

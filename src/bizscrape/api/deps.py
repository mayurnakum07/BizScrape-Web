"""Shared FastAPI dependencies."""

from __future__ import annotations

from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.validation import parse_job_id

_manager: JobManager | None = None


def get_job_manager() -> JobManager:
    global _manager
    if _manager is None:
        _manager = JobManager()
    return _manager


def set_job_manager(manager: JobManager | None) -> None:
    global _manager
    _manager = manager


def validated_job_id(job_id: str) -> str:
    return parse_job_id(job_id)

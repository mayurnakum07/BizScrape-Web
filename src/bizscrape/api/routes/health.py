"""Health and readiness routes."""

from __future__ import annotations

import importlib.util
from pathlib import Path

from fastapi import APIRouter, Response

from bizscrape.api.job_storage import ensure_job_data_dir
from bizscrape.api.models import HealthResponse, ReadinessResponse
from bizscrape.api.settings import get_settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe - process is running."""
    return HealthResponse(status="ok")


@router.get("/health/ready", response_model=ReadinessResponse)
def readiness(response: Response) -> ReadinessResponse:
    """
    Readiness probe - required runtime dependencies without starting a scrape.

    Does not launch Playwright or open a browser.
    """
    settings = get_settings()
    checks: dict[str, str] = {}

    try:
        ensure_job_data_dir(settings)
        probe = Path(settings.job_data_dir) / ".write_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
        checks["job_data_dir"] = "ok"
    except OSError:
        checks["job_data_dir"] = "fail"

    if importlib.util.find_spec("playwright") is not None:
        checks["playwright"] = "ok"
    else:
        checks["playwright"] = "fail"

    status: str = "ok" if all(value == "ok" for value in checks.values()) else "degraded"
    if status != "ok":
        response.status_code = 503
    return ReadinessResponse(status=status, checks=checks)

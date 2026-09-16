"""External-source failure handling with controlled fake errors."""

from __future__ import annotations

import time

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from bizscrape.engine import ScrapeRunResult
from bizscrape.errors import ProviderError
from fastapi.testclient import TestClient
from tests.python.helpers import VALID_JOB_BODY, make_settings


async def _empty_discover(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "stage_started", "stage": "discover"})
        event_callback({"type": "business_found", "count": 0, "kept": 0})
        event_callback({"type": "stage_completed", "stage": "discover"})
        event_callback({"type": "job_completed"})
    return ScrapeRunResult(
        csv_path=cfg.out or "data/test.csv",
        records=[],
        stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
        cancelled=False,
    )


async def _blocked_source(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "stage_started", "stage": "discover"})
    raise ProviderError("HTTP 429 rate limited — access denied")


def test_empty_discovery_completes_with_zero_results(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    manager = JobManager(
        settings=make_settings(job_data_dir=str(tmp_path / "jobs")),
        run_scrape_fn=_empty_discover,
    )
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        for _ in range(40):
            job = client.get(f"/jobs/{job_id}").json()
            if job["status"] in ("completed", "failed", "cancelled"):
                break
            time.sleep(0.05)
        assert job["status"] == "completed"
        results = client.get(f"/jobs/{job_id}/results").json()
        assert results["summary"]["businesses"] == 0
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_blocked_source_surfaces_failure(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    manager = JobManager(
        settings=make_settings(job_data_dir=str(tmp_path / "jobs")),
        run_scrape_fn=_blocked_source,
    )
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        for _ in range(40):
            job = client.get(f"/jobs/{job_id}").json()
            if job["status"] == "failed":
                break
            time.sleep(0.05)
        assert job["status"] == "failed"
        assert job["error"]["code"] in ("RATE_LIMITED", "SOURCE_BLOCKED", "SOURCE_UNAVAILABLE")
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

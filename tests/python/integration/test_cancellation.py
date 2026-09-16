"""Cancellation lifecycle tests."""

from __future__ import annotations

import time

from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from tests.python.helpers import VALID_JOB_BODY, make_settings, staged_scrape_factory


def _client_with_scraper(tmp_path, stage_delays: dict[str, float]) -> TestClient:
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(
        settings=settings,
        run_scrape_fn=staged_scrape_factory(stage_delays=stage_delays),
    )
    set_job_manager(manager)
    return TestClient(create_app())


def test_cancel_during_discovery(tmp_path) -> None:
    client = _client_with_scraper(tmp_path, {"discover": 2.0, "enrich": 2.0})
    with client:
        created = client.post("/jobs", json=VALID_JOB_BODY)
        job_id = created.json()["jobId"]
        time.sleep(0.1)
        cancelled = client.post(f"/jobs/{job_id}/cancel")
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] in ("cancelling", "cancelled")

        final = None
        for _ in range(60):
            final = client.get(f"/jobs/{job_id}").json()
            if final["status"] == "cancelled":
                break
            time.sleep(0.05)
        assert final is not None
        assert final["status"] == "cancelled"
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_cancel_during_enrichment(tmp_path) -> None:
    client = _client_with_scraper(
        tmp_path,
        {"discover": 0.2, "website_lookup": 0.2, "enrich": 3.0},
    )
    with client:
        created = client.post("/jobs", json=VALID_JOB_BODY)
        job_id = created.json()["jobId"]
        time.sleep(0.5)
        cancelled = client.post(f"/jobs/{job_id}/cancel")
        assert cancelled.status_code == 200

        final = None
        for _ in range(80):
            final = client.get(f"/jobs/{job_id}").json()
            if final["status"] == "cancelled":
                break
            time.sleep(0.05)
        assert final is not None
        assert final["status"] == "cancelled"
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_repeat_cancel_is_idempotent(tmp_path) -> None:
    client = _client_with_scraper(tmp_path, {"discover": 2.0})
    with client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        time.sleep(0.1)
        first = client.post(f"/jobs/{job_id}/cancel")
        second = client.post(f"/jobs/{job_id}/cancel")
        assert first.status_code == 200
        assert second.status_code in (200, 409)
        if second.status_code == 409:
            assert second.json()["code"] == "JOB_CANCEL_IN_PROGRESS"
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_cancel_terminal_job_returns_current_state(tmp_path) -> None:
    from tests.python.helpers import instant_scrape_factory

    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=instant_scrape_factory())
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        for _ in range(40):
            if client.get(f"/jobs/{job_id}").json()["status"] == "completed":
                break
            time.sleep(0.05)
        cancelled = client.post(f"/jobs/{job_id}/cancel")
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] == "completed"
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

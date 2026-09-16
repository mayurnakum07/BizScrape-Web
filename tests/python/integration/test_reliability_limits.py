"""Bounded buffers, activity logs, and manager cleanup."""

from __future__ import annotations

import time

from bizscrape.api.deps import set_job_manager
from bizscrape.api.events import JobEventBus
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from tests.python.helpers import VALID_JOB_BODY, make_settings, staged_scrape_factory


def test_event_bus_buffer_is_bounded() -> None:
    bus = JobEventBus("bounded", maxlen=5)
    for index in range(10):
        bus.publish("stage_progress", {"index": index})
    assert len(bus.events_after(None)) <= 5


def test_activity_log_truncates_to_forty_entries(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(
        settings=settings,
        run_scrape_fn=staged_scrape_factory(stage_delays={"discover": 0.1, "enrich": 0.1}),
    )
    set_job_manager(manager)

    from bizscrape.api.app import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        for _ in range(40):
            job = client.get(f"/jobs/{job_id}").json()
            if job["status"] in ("completed", "failed", "cancelled"):
                break
            time.sleep(0.05)
        final = client.get(f"/jobs/{job_id}").json()
        assert len(final["activity"]) <= 40

    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_manager_clears_running_tasks_after_completion(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(
        settings=settings,
        run_scrape_fn=staged_scrape_factory(stage_delays={"discover": 0.2}),
    )
    set_job_manager(manager)

    from bizscrape.api.app import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        for _ in range(60):
            if client.get(f"/jobs/{job_id}").json()["status"] == "completed":
                break
            time.sleep(0.05)

    assert manager._running == 0
    assert job_id not in manager._tasks

    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

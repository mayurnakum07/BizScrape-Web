"""Application restart / in-memory job loss behavior."""

from __future__ import annotations

import time

from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from tests.python.helpers import VALID_JOB_BODY, instant_scrape_factory, make_settings, staged_scrape_factory


def test_restart_loses_in_memory_jobs(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(
        settings=settings,
        run_scrape_fn=staged_scrape_factory(stage_delays={"discover": 5.0}),
    )
    set_job_manager(manager)

    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID_JOB_BODY).json()["jobId"]
        assert client.get(f"/jobs/{job_id}").status_code == 200

    # Simulate process restart with a fresh manager.
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()
    new_manager = JobManager(
        settings=make_settings(job_data_dir=str(tmp_path / "jobs")),
        run_scrape_fn=instant_scrape_factory(),
    )
    set_job_manager(new_manager)

    with TestClient(create_app()) as client:
        assert client.get(f"/jobs/{job_id}").status_code == 404

    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_completed_job_survives_while_process_runs(tmp_path) -> None:
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
        assert client.get(f"/jobs/{job_id}").json()["status"] == "completed"
        assert client.get(f"/jobs/{job_id}/results").status_code == 200

    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

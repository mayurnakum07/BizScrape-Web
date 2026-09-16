"""Concurrent job isolation tests."""

from __future__ import annotations

import time

from fastapi.testclient import TestClient

from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from tests.python.helpers import VALID_JOB_BODY, instant_scrape_factory, make_settings


def test_concurrent_jobs_remain_isolated(tmp_path) -> None:
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(
        job_data_dir=str(tmp_path / "jobs"),
        max_concurrent_jobs=2,
    )
    manager = JobManager(
        settings=settings,
        run_scrape_fn=instant_scrape_factory(),
    )
    set_job_manager(manager)

    from bizscrape.api.app import create_app

    with TestClient(create_app()) as client:
        first = client.post("/jobs", json={**VALID_JOB_BODY, "businessType": "alpha"})
        second = client.post("/jobs", json={**VALID_JOB_BODY, "businessType": "beta"})
        assert first.status_code == 201
        assert second.status_code == 201
        job_a = first.json()["jobId"]
        job_b = second.json()["jobId"]
        assert job_a != job_b

        for _ in range(40):
            snap_a = client.get(f"/jobs/{job_a}").json()
            snap_b = client.get(f"/jobs/{job_b}").json()
            if snap_a["status"] == "completed" and snap_b["status"] == "completed":
                break
            time.sleep(0.05)

        results_a = client.get(f"/jobs/{job_a}/results").json()
        results_b = client.get(f"/jobs/{job_b}/results").json()

        assert results_a["jobId"] == job_a
        assert results_b["jobId"] == job_b
        assert results_a["records"][0]["company_name"] == "alpha Co"
        assert results_b["records"][0]["company_name"] == "beta Co"

        cancel = client.post(f"/jobs/{job_a}/cancel")
        assert cancel.status_code == 200
        assert cancel.json()["id"] == job_a

    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

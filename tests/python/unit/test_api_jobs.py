"""API validation and job lifecycle tests (mocked scraper)."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest
from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import Settings, reset_settings_cache
from bizscrape.engine import ScrapeRunResult


def _settings(**overrides: Any) -> Settings:
    base = dict(
        host="127.0.0.1",
        port=8000,
        allowed_origins="http://localhost:3000",
        max_concurrent_jobs=2,
        max_queued_jobs=5,
        min_api_target=1,
        max_api_target=500,
        job_data_dir="data/test-jobs",
        log_level="WARNING",
        cancel_timeout_seconds=45,
        max_job_retries=3,
        sse_max_reconnect_attempts=8,
        rate_limit_create_per_minute=0,
        rate_limit_cancel_per_minute=0,
        max_request_body_bytes=65536,
        job_data_retention_hours=0,
        debug=True,
    )
    base.update(overrides)
    return Settings(**base)


async def _fake_scrape(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "stage_started", "stage": "discover"})
        event_callback({"type": "business_found", "count": 2, "kept": 2})
        event_callback({"type": "stage_completed", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "website_lookup"})
        event_callback({"type": "stage_completed", "stage": "website_lookup"})
        event_callback({"type": "stage_started", "stage": "enrich"})
        event_callback({"type": "stage_completed", "stage": "enrich"})
        event_callback({"type": "stage_started", "stage": "deduplicate"})
        event_callback({"type": "stage_completed", "stage": "deduplicate"})
        event_callback({"type": "stage_started", "stage": "export"})
        event_callback({"type": "stage_completed", "stage": "export"})
        event_callback({"type": "job_completed"})

    if cancel_flag is not None and cancel_flag.is_set():
        return ScrapeRunResult(
            csv_path=cfg.out or "data/test.csv",
            records=[],
            stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
            cancelled=True,
        )

    records = [
        {
            "id": "1",
            "company_name": "Cafe One",
            "website": "https://example.com",
            "email_primary": "a@example.com",
            "emails_all": "a@example.com",
            "phone_primary": "+1 90000 00001",
            "phones_all": "+1 90000 00001",
            "address": "New York",
            "area": "Manhattan",
            "category": "Cafe",
            "rating": "4.5",
            "review_count": "10",
            "linkedin": "",
            "facebook": "",
            "instagram": "",
            "sources": "gmaps",
            "maps_url": "",
            "first_seen": "",
            "last_enriched": "",
        },
        {
            "id": "2",
            "company_name": "Cafe Two",
            "website": "",
            "email_primary": "",
            "emails_all": "",
            "phone_primary": "+1 90000 00002",
            "phones_all": "+1 90000 00002",
            "address": "New York",
            "area": "Manhattan",
            "category": "Cafe",
            "rating": "",
            "review_count": "",
            "linkedin": "",
            "facebook": "",
            "instagram": "",
            "sources": "gmaps",
            "maps_url": "",
            "first_seen": "",
            "last_enriched": "",
        },
    ]
    return ScrapeRunResult(
        csv_path=cfg.out or "data/test.csv",
        records=records,
        stats={
            "total": 2,
            "with_website": 1,
            "with_email": 1,
            "with_phone": 2,
            "pending_enrichment": 0,
        },
        cancelled=False,
    )


async def _slow_cancellable_scrape(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "stage_started", "stage": "discover"})
    for _ in range(50):
        if cancel_flag is not None and cancel_flag.is_set():
            if event_callback:
                event_callback({"type": "job_cancelled"})
            return ScrapeRunResult(
                csv_path=cfg.out or "data/test.csv",
                records=[],
                stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
                cancelled=True,
            )
        await asyncio.sleep(0.02)
    return await _fake_scrape(cfg, event_callback, cancel_flag)


@pytest.fixture
def client(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_fake_scrape)
    set_job_manager(manager)
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


@pytest.fixture
def cancel_client(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_slow_cancellable_scrape)
    set_job_manager(manager)
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


VALID_BODY = {
    "businessType": "cafe",    "country": "USA",    "state": "NY",    "city": "New York",
    "area": "Manhattan",
    "target": 20,
    "sources": ["gmaps"],
}


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_job_valid(client: TestClient) -> None:
    response = client.post("/jobs", json=VALID_BODY)
    assert response.status_code == 201
    data = response.json()
    assert "jobId" in data
    assert data["jobId"]


def test_validation_missing_business_type(client: TestClient) -> None:
    body = {**VALID_BODY}
    del body["businessType"]
    response = client.post("/jobs", json=body)
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_validation_missing_city(client: TestClient) -> None:
    body = {**VALID_BODY}
    del body["city"]
    response = client.post("/jobs", json=body)
    assert response.status_code == 422


def test_validation_invalid_target(client: TestClient) -> None:
    response = client.post("/jobs", json={**VALID_BODY, "target": 0})
    assert response.status_code == 422
    response = client.post("/jobs", json={**VALID_BODY, "target": 9999})
    assert response.status_code == 422


def test_validation_invalid_source(client: TestClient) -> None:
    response = client.post("/jobs", json={**VALID_BODY, "sources": ["facebook"]})
    assert response.status_code == 422


def test_job_lifecycle_completed(client: TestClient) -> None:
    created = client.post("/jobs", json=VALID_BODY)
    job_id = created.json()["jobId"]

    final = None
    for _ in range(40):
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        final = response.json()
        if final["status"] in ("completed", "failed", "cancelled"):
            break
        # TestClient runs background tasks; tiny yield
        import time

        time.sleep(0.05)

    assert final is not None
    assert final["status"] == "completed"
    assert final["csvReady"] is True
    assert final["stats"]["businessesFound"] == 2

    results = client.get(f"/jobs/{job_id}/results")
    assert results.status_code == 200
    payload = results.json()
    assert payload["status"] == "ready"
    assert payload["summary"]["businesses"] == 2
    assert payload["summary"]["websites"] == 1
    assert payload["summary"]["emails"] == 1
    assert payload["summary"]["phones"] == 2
    assert len(payload["records"]) == 2


def test_cancel_job(cancel_client: TestClient) -> None:
    created = cancel_client.post("/jobs", json=VALID_BODY)
    job_id = created.json()["jobId"]

    import time

    time.sleep(0.05)
    cancelled = cancel_client.post(f"/jobs/{job_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] in ("cancelling", "cancelled")

    final = None
    for _ in range(50):
        response = cancel_client.get(f"/jobs/{job_id}")
        final = response.json()
        if final["status"] == "cancelled":
            break
        time.sleep(0.05)

    assert final is not None
    assert final["status"] == "cancelled"


def test_get_missing_job(client: TestClient) -> None:
    response = client.get("/jobs/does-not-exist")
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_JOB_ID"

"""Error classification, retry, and cancel reliability tests."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import pytest
from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.error_codes import (
    BROWSER_START_FAILED,
    ENRICHMENT_FAILED,
    INVALID_CONFIGURATION,
    RATE_LIMITED,
    SOURCE_BLOCKED,
    SOURCE_UNAVAILABLE,
    classify_exception,
)
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import Settings, reset_settings_cache
from bizscrape.engine import ScrapeRunResult
from bizscrape.errors import ProviderError, UsageError


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
        cancel_timeout_seconds=2,
        max_job_retries=2,
        sse_max_reconnect_attempts=8,
        rate_limit_create_per_minute=0,
        rate_limit_cancel_per_minute=0,
        max_request_body_bytes=65536,
        job_data_retention_hours=0,
        debug=True,
    )
    base.update(overrides)
    return Settings(**base)


def test_classify_usage_error_not_retryable():
    result = classify_exception(UsageError("bad"), stage=None)
    assert result.code == INVALID_CONFIGURATION
    assert result.retryable is False
    assert result.status_code == 400


def test_classify_rate_limit():
    result = classify_exception(ProviderError("HTTP 429 too many requests"), stage="discover")
    assert result.code == RATE_LIMITED
    assert result.retryable is True
    assert result.status_code == 429


def test_classify_source_blocked():
    result = classify_exception(ProviderError("captcha blocked"), stage="discover")
    assert result.code == SOURCE_BLOCKED
    assert result.retryable is False


def test_classify_browser_start():
    result = classify_exception(
        RuntimeError("No usable browser found.\n  Fix: playwright install chromium"),
        stage="discover",
    )
    assert result.code == BROWSER_START_FAILED
    assert result.retryable is True


def test_classify_enrichment_stage():
    result = classify_exception(RuntimeError("boom"), stage="enrich")
    assert result.code == ENRICHMENT_FAILED
    assert result.retryable is True


def test_classify_unexpected_source():
    result = classify_exception(RuntimeError("network down"), stage="discover")
    assert result.code == SOURCE_UNAVAILABLE


async def _failing_scrape(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "job_started", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "discover"})
        event_callback({"type": "business_found", "count": 3, "kept": 3})
        event_callback(
            {
                "type": "results_updated",
                "count": 1,
                "records": [
                    {
                        "id": "1",
                        "company_name": "Cafe One",
                        "website": "",
                        "email_primary": "",
                        "emails_all": "",
                        "phone_primary": "",
                        "phones_all": "",
                        "address": "",
                        "area": "",
                        "category": "",
                        "rating": "",
                        "review_count": "",
                        "linkedin": "",
                        "facebook": "",
                        "instagram": "",
                        "sources": "gmaps",
                        "maps_url": "",
                        "first_seen": "",
                        "last_enriched": "",
                    }
                ],
            }
        )
        event_callback({"type": "stage_completed", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "enrich"})
    raise ProviderError("HTTP 429 rate limited")


async def _non_retryable_fail(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "job_started", "stage": "discover"})
    raise ProviderError("captcha blocked access denied")


async def _hang_until_cancel(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "job_started", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "discover"})
    for _ in range(200):
        if cancel_flag is not None and cancel_flag.is_set():
            if event_callback:
                event_callback({"type": "job_cancelled"})
            return ScrapeRunResult(
                csv_path=cfg.out or "data/test.csv",
                records=[],
                stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
                cancelled=True,
            )
        await asyncio.sleep(0.05)
    return ScrapeRunResult(
        csv_path=cfg.out or "data/test.csv",
        records=[],
        stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
        cancelled=False,
    )


VALID = {
    "businessType": "cafe",    "country": "USA",    "state": "NY",    "city": "New York",
    "area": "Manhattan",
    "target": 20,
    "sources": ["gmaps"],
}


@pytest.fixture
def failing_client(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_failing_scrape)
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        yield client, manager
    set_job_manager(None)
    reset_settings_cache()


def test_partial_results_after_later_stage_failure(failing_client):
    client, _manager = failing_client
    job_id = client.post("/jobs", json=VALID).json()["jobId"]
    final = None
    for _ in range(40):
        final = client.get(f"/jobs/{job_id}").json()
        if final["status"] == "failed":
            break
        time.sleep(0.05)
    assert final is not None
    assert final["status"] == "failed"
    assert final["error"]["code"] == RATE_LIMITED
    assert final["error"]["retryable"] is True
    assert final["partialResults"] is True
    results = client.get(f"/jobs/{job_id}/results").json()
    assert results["summary"]["businesses"] >= 1


def test_http_status_mapping(failing_client):
    import uuid

    client, _manager = failing_client
    missing = str(uuid.uuid4())
    assert client.get(f"/jobs/{missing}").status_code == 404
    assert client.get(f"/jobs/{missing}").json()["code"] == "JOB_NOT_FOUND"
    assert "requestId" in client.get(f"/jobs/{missing}").json()

    bad = client.post("/jobs", json={**VALID, "target": 0})
    assert bad.status_code == 422

    # Capacity: fill queue
    reset_settings_cache()


def test_retry_creates_new_job(failing_client):
    client, _manager = failing_client
    job_id = client.post("/jobs", json=VALID).json()["jobId"]
    for _ in range(40):
        if client.get(f"/jobs/{job_id}").json()["status"] == "failed":
            break
        time.sleep(0.05)

    retried = client.post(f"/jobs/{job_id}/retry")
    assert retried.status_code == 201
    body = retried.json()
    assert body["jobId"] != job_id
    assert body["retryOfJobId"] == job_id
    assert body["retryCount"] == 1


def test_retry_limit(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"), max_job_retries=1)
    manager = JobManager(settings=settings, run_scrape_fn=_failing_scrape)
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID).json()["jobId"]
        for _ in range(40):
            if client.get(f"/jobs/{job_id}").json()["status"] == "failed":
                break
            time.sleep(0.05)
        first = client.post(f"/jobs/{job_id}/retry")
        assert first.status_code == 201
        new_id = first.json()["jobId"]
        for _ in range(40):
            if client.get(f"/jobs/{new_id}").json()["status"] == "failed":
                break
            time.sleep(0.05)
        second = client.post(f"/jobs/{new_id}/retry")
        assert second.status_code == 429
        assert second.json()["code"] == "JOB_RETRY_LIMIT"
    set_job_manager(None)
    reset_settings_cache()


def test_non_retryable_rejects_retry(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_non_retryable_fail)
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID).json()["jobId"]
        for _ in range(40):
            job = client.get(f"/jobs/{job_id}").json()
            if job["status"] == "failed":
                break
            time.sleep(0.05)
        assert job["error"]["retryable"] is False
        response = client.post(f"/jobs/{job_id}/retry")
        assert response.status_code == 409
        assert response.json()["code"] == "JOB_NOT_RETRYABLE"
    set_job_manager(None)
    reset_settings_cache()


def test_cancel_flow_and_repeat(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_hang_until_cancel)
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        job_id = client.post("/jobs", json=VALID).json()["jobId"]
        time.sleep(0.05)
        first = client.post(f"/jobs/{job_id}/cancel")
        assert first.status_code == 200
        assert first.json()["status"] in ("cancelling", "cancelled")
        second = client.post(f"/jobs/{job_id}/cancel")
        # Either already cancelled (200) or cancel in progress (409)
        assert second.status_code in (200, 409)
        if second.status_code == 409:
            assert second.json()["code"] == "JOB_CANCEL_IN_PROGRESS"
        for _ in range(60):
            if client.get(f"/jobs/{job_id}").json()["status"] == "cancelled":
                break
            time.sleep(0.05)
        assert client.get(f"/jobs/{job_id}").json()["status"] == "cancelled"
    set_job_manager(None)
    reset_settings_cache()


def test_request_id_header(failing_client):
    client, _manager = failing_client
    response = client.get("/jobs/missing", headers={"X-Request-ID": "req-test-1"})
    assert response.headers.get("X-Request-ID") == "req-test-1"
    assert response.json()["requestId"] == "req-test-1"

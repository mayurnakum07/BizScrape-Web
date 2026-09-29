"""Full-stack API smoke test (mocked scraper - no Playwright required)."""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from pathlib import Path
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
        job_data_dir="data/test-smoke-jobs",
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


async def _smoke_scrape(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "stage_started", "stage": "discover"})
        event_callback({"type": "business_found", "count": 1, "kept": 1})
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

    csv_path = cfg.out or "data/test-smoke.csv"
    Path(csv_path).parent.mkdir(parents=True, exist_ok=True)
    Path(csv_path).write_text(
        "company_name,website,email_primary\nSmoke Test Cafe,https://example.com,hello@example.com\n",
        encoding="utf-8-sig",
    )

    records = [
        {
            "id": "1",
            "company_name": "Smoke Test Cafe",
            "website": "https://example.com",
            "email_primary": "hello@example.com",
            "emails_all": "hello@example.com",
            "phone_primary": "+1 90000 00001",
            "phones_all": "+1 90000 00001",
            "address": "New York",
            "area": "Test Area",
            "category": "Cafe",
            "rating": "4.0",
            "review_count": "1",
            "linkedin": "",
            "facebook": "",
            "instagram": "",
            "sources": "gmaps",
            "maps_url": "",
            "first_seen": "",
            "last_enriched": "",
        }
    ]
    return ScrapeRunResult(
        csv_path=csv_path,
        records=records,
        stats={
            "total": 1,
            "with_website": 1,
            "with_email": 1,
            "with_phone": 1,
            "pending_enrichment": 0,
        },
        cancelled=False,
    )


@pytest.fixture
def client(tmp_path):
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_smoke_scrape)
    set_job_manager(manager)
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


VALID_BODY = {
    "businessType": "cafe",    "country": "USA",    "state": "NY",    "city": "New York",
    "area": "Test Area",
    "target": 5,
    "sources": ["gmaps"],
}


def test_health_endpoints(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    ready = client.get("/health/ready")
    assert ready.status_code == 200
    body = ready.json()
    assert body["status"] == "ok"
    assert body["checks"]["job_data_dir"] == "ok"
    assert body["checks"]["playwright"] == "ok"


def test_full_job_lifecycle_with_sse_and_csv(client: TestClient) -> None:
    created = client.post("/jobs", json=VALID_BODY)
    assert created.status_code == 201
    job_id = created.json()["jobId"]
    uuid.UUID(job_id)

    final = None
    for _ in range(40):
        snapshot = client.get(f"/jobs/{job_id}")
        assert snapshot.status_code == 200
        final = snapshot.json()
        if final["status"] in ("completed", "failed", "cancelled"):
            break
        time.sleep(0.05)

    assert final is not None
    assert final["status"] == "completed"
    assert final["csvReady"] is True

    results = client.get(f"/jobs/{job_id}/results")
    assert results.status_code == 200
    payload = results.json()
    assert payload["status"] == "ready"
    assert payload["summary"]["businesses"] == 1
    assert len(payload["records"]) == 1

    with client.stream("GET", f"/jobs/{job_id}/events") as stream:
        assert stream.status_code == 200
        saw_event = False
        for line in stream.iter_lines():
            if line.startswith("data:"):
                event = json.loads(line[5:].strip())
                assert event["jobId"] == job_id
                saw_event = True
                if event.get("type") in ("job_completed", "job_failed", "job_cancelled"):
                    break
        assert saw_event

    csv_response = client.get(f"/jobs/{job_id}/result")
    assert csv_response.status_code == 200
    assert "text/csv" in csv_response.headers.get("content-type", "")


def test_cancel_smoke(tmp_path) -> None:
    async def _slow(cfg, event_callback=None, cancel_flag=None):
        if event_callback:
            event_callback({"type": "stage_started", "stage": "discover"})
        for _ in range(100):
            if cancel_flag is not None and cancel_flag.is_set():
                return ScrapeRunResult(
                    csv_path=cfg.out or "data/test.csv",
                    records=[],
                    stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
                    cancelled=True,
                )
            await asyncio.sleep(0.02)
        return await _smoke_scrape(cfg, event_callback, cancel_flag)

    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_slow)
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        created = client.post("/jobs", json=VALID_BODY)
        assert created.status_code == 201
        job_id = created.json()["jobId"]
        time.sleep(0.05)
        cancelled = client.post(f"/jobs/{job_id}/cancel")
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] in ("cancelling", "cancelled")
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()

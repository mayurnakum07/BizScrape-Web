"""SSE event bus and endpoint tests."""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

import pytest
from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.events import JobEventBus, TERMINAL_EVENT_TYPES
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
        event_callback({"type": "job_started", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "discover"})
        event_callback({"type": "business_found", "count": 2, "kept": 2})
        event_callback(
            {
                "type": "results_updated",
                "count": 2,
                "records": [
                    {
                        "id": "1",
                        "company_name": "Cafe One",
                        "website": "https://example.com",
                        "email_primary": "a@example.com",
                        "emails_all": "a@example.com",
                        "phone_primary": "+91 90000 00001",
                        "phones_all": "+91 90000 00001",
                        "address": "Surat",
                        "area": "Mota Varachha",
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
                        "phone_primary": "+91 90000 00002",
                        "phones_all": "+91 90000 00002",
                        "address": "Surat",
                        "area": "Mota Varachha",
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
                ],
            }
        )
        event_callback({"type": "stage_completed", "stage": "discover"})
        event_callback({"type": "stage_started", "stage": "website_lookup"})
        event_callback({"type": "website_found", "count": 1})
        event_callback({"type": "stage_completed", "stage": "website_lookup"})
        event_callback({"type": "stage_started", "stage": "enrich"})
        event_callback({"type": "email_found", "count": 1})
        event_callback({"type": "phone_found", "count": 2})
        event_callback({"type": "stage_completed", "stage": "enrich"})
        event_callback({"type": "stage_started", "stage": "deduplicate"})
        event_callback({"type": "stage_completed", "stage": "deduplicate"})
        event_callback({"type": "stage_started", "stage": "export"})
        event_callback({"type": "csv_ready", "count": 2})
        event_callback({"type": "stage_completed", "stage": "export"})
        event_callback({"type": "job_completed", "count": 2})

    if cancel_flag is not None and cancel_flag.is_set():
        return ScrapeRunResult(
            csv_path=cfg.out or "data/test.csv",
            records=[],
            stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
            cancelled=True,
        )

    return ScrapeRunResult(
        csv_path=cfg.out or "data/test.csv",
        records=[
            {
                "id": "1",
                "company_name": "Cafe One",
                "website": "https://example.com",
                "email_primary": "a@example.com",
                "emails_all": "a@example.com",
                "phone_primary": "+91 90000 00001",
                "phones_all": "+91 90000 00001",
                "address": "Surat",
                "area": "Mota Varachha",
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
                "phone_primary": "+91 90000 00002",
                "phones_all": "+91 90000 00002",
                "address": "Surat",
                "area": "Mota Varachha",
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
        ],
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
        event_callback({"type": "job_started", "stage": "discover"})
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
        yield test_client, manager
    set_job_manager(None)
    reset_settings_cache()


VALID_BODY = {
    "businessType": "cafe",    "country": "India",    "state": "Gujarat",    "city": "Surat",
    "area": "Mota Varachha",
    "target": 20,
    "sources": ["gmaps"],
}


def test_event_bus_envelope_and_order():
    bus = JobEventBus("job-1")
    first = bus.publish("job_started", {"stage": "discover"})
    second = bus.publish("stage_started", {"stage": "discover"})
    third = bus.publish("job_completed", {"count": 1})

    assert first["id"] == "1"
    assert first["jobId"] == "job-1"
    assert first["type"] == "job_started"
    assert first["timestamp"].endswith("Z")
    assert "stage" in first["data"]
    assert second["id"] == "2"
    assert third["type"] in TERMINAL_EVENT_TYPES
    assert bus.closed is True
    assert [e["type"] for e in bus.snapshot()] == [
        "job_started",
        "stage_started",
        "job_completed",
    ]


def test_event_bus_replay_after_id():
    bus = JobEventBus("job-1")
    bus.publish("job_started", {})
    bus.publish("business_found", {"count": 3})
    bus.publish("job_completed", {})
    replay = bus.events_after("1")
    assert [e["id"] for e in replay] == ["2", "3"]


def test_sse_unknown_job(client):
    import uuid

    test_client, _manager = client
    missing = str(uuid.uuid4())
    response = test_client.get(f"/jobs/{missing}/events")
    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"


def test_sse_stream_completes_with_terminal_event(client):
    test_client, _manager = client
    created = test_client.post("/jobs", json=VALID_BODY)
    job_id = created.json()["jobId"]

    # Wait for job to finish so buffer has terminal event.
    final = None
    for _ in range(40):
        final = test_client.get(f"/jobs/{job_id}").json()
        if final["status"] in ("completed", "failed", "cancelled"):
            break
        time.sleep(0.05)
    assert final is not None
    assert final["status"] == "completed"

    with test_client.stream("GET", f"/jobs/{job_id}/events") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        body = "".join(response.iter_text())
        assert "job_completed" in body
        assert "event-stream" or "data:" in body
        # Parse last data line
        types = []
        for line in body.splitlines():
            if line.startswith("data: "):
                payload = json.loads(line[6:])
                assert payload["jobId"] == job_id
                assert "id" in payload
                assert "timestamp" in payload
                types.append(payload["type"])
        assert types[-1] == "job_completed"
        assert types.index("job_started") < types.index("job_completed")


def test_concurrent_jobs_isolated(client):
    test_client, manager = client
    a = test_client.post("/jobs", json=VALID_BODY).json()["jobId"]
    b = test_client.post("/jobs", json={**VALID_BODY, "businessType": "bakery"}).json()[
        "jobId"
    ]

    for _ in range(40):
        sa = test_client.get(f"/jobs/{a}").json()["status"]
        sb = test_client.get(f"/jobs/{b}").json()["status"]
        if sa == "completed" and sb == "completed":
            break
        time.sleep(0.05)

    bus_a = manager.get_event_bus(a)
    bus_b = manager.get_event_bus(b)
    assert bus_a is not None and bus_b is not None
    assert all(e["jobId"] == a for e in bus_a.snapshot())
    assert all(e["jobId"] == b for e in bus_b.snapshot())
    assert bus_a.snapshot()[-1]["type"] == "job_completed"
    assert bus_b.snapshot()[-1]["type"] == "job_completed"


def test_cancel_publishes_cancelled_event(tmp_path):
    reset_settings_cache()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_slow_cancellable_scrape)
    set_job_manager(manager)
    app = create_app()
    with TestClient(app) as test_client:
        job_id = test_client.post("/jobs", json=VALID_BODY).json()["jobId"]
        time.sleep(0.05)
        test_client.post(f"/jobs/{job_id}/cancel")
        final = None
        for _ in range(50):
            final = test_client.get(f"/jobs/{job_id}").json()
            if final["status"] == "cancelled":
                break
            time.sleep(0.05)
        assert final is not None
        assert final["status"] == "cancelled"
        bus = manager.get_event_bus(job_id)
        assert bus is not None
        types = [e["type"] for e in bus.snapshot()]
        assert "job_cancelled" in types
        assert types[-1] == "job_cancelled"
    set_job_manager(None)
    reset_settings_cache()

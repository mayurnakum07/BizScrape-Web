"""Security-focused API tests."""

from __future__ import annotations

import asyncio
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import Settings, reset_settings_cache
from bizscrape.csv_safety import neutralize_csv_formula
from bizscrape.engine import ScrapeRunResult


def _settings(**overrides: Any) -> Settings:
    base = dict(
        host="127.0.0.1",
        port=8000,
        allowed_origins="http://localhost:3000",
        max_concurrent_jobs=1,
        max_queued_jobs=0,
        min_api_target=1,
        max_api_target=500,
        job_data_dir="data/test-jobs",
        log_level="WARNING",
        cancel_timeout_seconds=45,
        max_job_retries=3,
        sse_max_reconnect_attempts=8,
        rate_limit_create_per_minute=3,
        rate_limit_cancel_per_minute=5,
        max_request_body_bytes=4096,
        job_data_retention_hours=0,
        debug=False,
    )
    base.update(overrides)
    return Settings(**base)


async def _instant_scrape(cfg, event_callback=None, cancel_flag=None):
    if event_callback:
        event_callback({"type": "job_completed"})
    return ScrapeRunResult(
        csv_path=cfg.out or "data/test.csv",
        records=[],
        stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
        cancelled=False,
    )


async def _slow_scrape(cfg, event_callback=None, cancel_flag=None):
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
        await asyncio.sleep(0.05)
    return await _instant_scrape(cfg, event_callback, cancel_flag)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_CREATE_PER_MINUTE", "3")
    monkeypatch.setenv("RATE_LIMIT_CANCEL_PER_MINUTE", "5")
    monkeypatch.setenv("DEBUG", "false")
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=_instant_scrape)
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


def test_invalid_job_id_rejected(client: TestClient) -> None:
    response = client.get("/jobs/not-a-uuid")
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_JOB_ID"


def test_missing_job_with_valid_uuid(client: TestClient) -> None:
    missing = str(uuid.uuid4())
    response = client.get(f"/jobs/{missing}")
    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"


def test_reject_control_characters_in_text_fields(client: TestClient) -> None:
    response = client.post(
        "/jobs",
        json={**VALID_BODY, "businessType": "caf\u0007e"},
    )
    assert response.status_code == 422


def test_normalize_whitespace_in_text_fields(client: TestClient) -> None:
    response = client.post(
        "/jobs",
        json={**VALID_BODY, "city": "  New York   NY  "},
    )
    assert response.status_code == 201
    job_id = response.json()["jobId"]
    snapshot = client.get(f"/jobs/{job_id}").json()
    assert snapshot["config"]["city"] == "New York NY"


def test_job_capacity_returns_429(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RATE_LIMIT_CREATE_PER_MINUTE", "0")
    monkeypatch.setenv("MAX_CONCURRENT_JOBS", "1")
    monkeypatch.setenv("MAX_QUEUED_JOBS", "0")
    reset_settings_cache()
    reset_rate_limiter()
    settings = _settings(
        job_data_dir=str(tmp_path / "jobs"),
        max_concurrent_jobs=1,
        max_queued_jobs=0,
        rate_limit_create_per_minute=0,
    )
    manager = JobManager(settings=settings, run_scrape_fn=_slow_scrape)
    set_job_manager(manager)
    app = create_app()
    with TestClient(app) as test_client:
        first = test_client.post("/jobs", json=VALID_BODY)
        assert first.status_code == 201
        second = test_client.post("/jobs", json=VALID_BODY)
        assert second.status_code == 429
        assert second.json()["code"] == "JOB_CAPACITY"
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()


def test_create_rate_limit(client: TestClient) -> None:
    reset_rate_limiter()
    for _ in range(3):
        response = client.post("/jobs", json=VALID_BODY)
        assert response.status_code == 201
    response = client.post("/jobs", json=VALID_BODY)
    assert response.status_code == 429
    assert response.json()["code"] == "RATE_LIMITED"


def test_cors_allows_configured_origin(client: TestClient) -> None:
    response = client.options(
        "/jobs",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_blocks_unknown_origin(client: TestClient) -> None:
    response = client.post(
        "/jobs",
        json=VALID_BODY,
        headers={"Origin": "https://evil.example"},
    )
    assert "access-control-allow-origin" not in response.headers


def test_request_body_size_limit(client: TestClient) -> None:
    huge = "x" * 5000
    response = client.post(
        "/jobs",
        json={**VALID_BODY, "area": huge},
        headers={"Content-Length": "999999"},
    )
    assert response.status_code == 413


def test_security_headers_present(client: TestClient) -> None:
    response = client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"


def test_openapi_hidden_when_debug_disabled(client: TestClient) -> None:
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_python_csv_formula_neutralization() -> None:
    assert neutralize_csv_formula("=1+1") == "'=1+1"
    assert neutralize_csv_formula("+19999999999") == "'+19999999999"
    assert neutralize_csv_formula("hello") == "hello"

"""Shared helpers for Python API integration tests."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Callable

from bizscrape.api.settings import Settings
from bizscrape.engine import ScrapeRunResult

RunScrapeFn = Callable[..., Any]


def make_settings(**overrides: Any) -> Settings:
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


VALID_JOB_BODY = {
    "businessType": "cafe",
    "country": "USA",
    "state": "NY",
    "city": "New York",
    "area": "Manhattan",
    "target": 10,
    "sources": ["gmaps"],
}


def sample_record(record_id: str, *, company_name: str | None = None) -> dict[str, Any]:
    return {
        "id": record_id,
        "company_name": company_name or f"Company {record_id}",
        "website": "https://example.com",
        "email_primary": f"{record_id}@example.com",
        "emails_all": f"{record_id}@example.com",
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


def instant_scrape_factory(
    *,
    records: list[dict[str, Any]] | None = None,
    label: str = "default",
) -> RunScrapeFn:
    """Return a fake scraper that completes immediately with optional records."""

    async def _run(cfg, event_callback=None, cancel_flag=None):
        if event_callback:
            event_callback({"type": "stage_started", "stage": "discover"})
            event_callback({"type": "business_found", "count": len(records or []), "kept": len(records or [])})
            event_callback({"type": "stage_completed", "stage": "discover"})
            event_callback({"type": "job_completed"})

        niche = getattr(cfg, "business_type", None) or label
        rows = records or [sample_record("1", company_name=f"{niche} Co")]
        csv_path = cfg.out or "data/test.csv"
        Path(csv_path).parent.mkdir(parents=True, exist_ok=True)
        Path(csv_path).write_text(
            "company_name,website\n"
            f"{rows[0]['company_name']},{rows[0].get('website', '')}\n",
            encoding="utf-8-sig",
        )
        return ScrapeRunResult(
            csv_path=csv_path,
            records=rows,
            stats={
                "total": len(rows),
                "with_website": sum(1 for row in rows if row.get("website")),
                "with_email": sum(1 for row in rows if row.get("email_primary")),
                "with_phone": sum(1 for row in rows if row.get("phone_primary")),
            },
            cancelled=False,
        )

    return _run


def staged_scrape_factory(*, stage_delays: dict[str, float]) -> RunScrapeFn:
    """Fake scraper that pauses at named stages until cancel or timeout."""

    async def _run(cfg, event_callback=None, cancel_flag=None):
        for stage, delay in stage_delays.items():
            if cancel_flag is not None and cancel_flag.is_set():
                if event_callback:
                    event_callback({"type": "job_cancelled"})
                return ScrapeRunResult(
                    csv_path=cfg.out or "data/test.csv",
                    records=[],
                    stats={"total": 0, "with_website": 0, "with_email": 0, "with_phone": 0},
                    cancelled=True,
                )
            if event_callback:
                event_callback({"type": "stage_started", "stage": stage})
            steps = max(1, int(delay / 0.05))
            for _ in range(steps):
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
            if event_callback:
                event_callback({"type": "stage_completed", "stage": stage})

        return await instant_scrape_factory(label="staged")(cfg, event_callback, cancel_flag)

    return _run

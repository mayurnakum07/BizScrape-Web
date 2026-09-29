"""
Programmatic scrape engine for CLI and API.

CLI continues to call ``pipeline.cmd_run`` with a Rich dashboard.
The API calls ``run_scrape`` with an event callback and cancel flag.
"""

from __future__ import annotations

import argparse
import threading
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from time import monotonic
from typing import Any

from . import config, ui
from . import shutdown as hard_stop
from .pipeline import cmd_run
from .store import Store

EventCallback = Callable[[dict[str, Any]], None]


@dataclass
class ScrapeRunConfig:
    """Typed scrape request - not CLI argv strings."""

    business_type: str
    city: str
    target: int
    area: str | None = None
    sources: list[str] = field(default_factory=lambda: ["gmaps"])
    search_all_localities: bool = False
    out: str = ""
    skip_websites: bool = False
    engine: str = "bing"
    concurrency: int = 6
    headful: bool = False
    max_scrolls: int = 40
    max_queries: int = 0
    website_limit: int = 0
    enrich_limit: int = 0
    retry_failed: bool = False
    require: str = "any"


def _map_stage(label: str) -> str:
    text = (label or "").lower()
    if "map" in text or "discover" in text or "google" in text:
        return "discover"
    if "website" in text:
        return "website_lookup"
    if "enrich" in text or "email" in text:
        return "enrich"
    if "dedup" in text:
        return "deduplicate"
    if "export" in text or "done" in text or "csv" in text:
        return "export"
    return "discover"


class EventDashboard:
    """Dashboard-compatible sink that emits structured events for the API."""

    def __init__(
        self,
        stats: ui.RunStats,
        callback: EventCallback | None = None,
        store: Store | None = None,
    ) -> None:
        self.stats = stats
        self._callback = callback
        self._store = store
        self._last_stage = ""
        self._last_stored = -1
        self._last_websites = -1
        self._last_emails = -1
        self._last_phones = -1
        self._last_results_signature: tuple[int, int, int, int] | None = None
        self._last_results_emit_at = 0.0
        self._results_emit_min_interval = 0.25

    def refresh(self) -> None:
        if not self._callback:
            return
        stage = _map_stage(self.stats.stage)
        if stage != self._last_stage:
            if self._last_stage:
                self._callback(
                    {
                        "type": "stage_completed",
                        "stage": self._last_stage,
                    }
                )
            self._callback({"type": "stage_started", "stage": stage})
            self._last_stage = stage

        payload: dict[str, Any] = {
            "type": "stage_progress",
            "stage": stage,
            "stage_label": self.stats.stage,
            "query": self.stats.query,
            "stored": self.stats.stored,
            "target": self.stats.target,
            "found": self.stats.found,
            "kept": self.stats.kept,
            "rejected": self.stats.rejected,
            "emails": self.stats.emails,
        }
        self._callback(payload)

        if self.stats.stored != self._last_stored:
            self._last_stored = self.stats.stored
            self._callback(
                {
                    "type": "business_found",
                    "count": self.stats.stored,
                    "found": self.stats.found,
                    "kept": self.stats.kept,
                }
            )
            self._emit_store_derived()

        # Enrichment counters can rise without new stored rows.
        if self.stats.emails != self._last_emails and self.stats.emails > 0:
            # Prefer store-derived absolute counts when available.
            self._emit_store_derived()

    def log(self, message: str) -> None:
        if self._callback:
            self._callback({"type": "log", "message": message})

    def _emit_store_derived(self) -> None:
        if not self._callback or self._store is None:
            return
        store_stats = self._store.stats()
        websites = int(store_stats.get("with_website") or 0)
        emails = int(store_stats.get("with_email") or 0)
        phones = int(store_stats.get("with_phone") or 0)

        if websites != self._last_websites:
            self._last_websites = websites
            if websites > 0:
                self._callback({"type": "website_found", "count": websites})

        if emails != self._last_emails:
            self._last_emails = emails
            if emails > 0:
                self._callback({"type": "email_found", "count": emails})

        if phones != self._last_phones:
            self._last_phones = phones
            if phones > 0:
                self._callback({"type": "phone_found", "count": phones})

        signature = (self.stats.stored, websites, emails, phones)
        now = monotonic()
        if signature == self._last_results_signature:
            return
        if (
            self._last_results_signature is not None
            and now - self._last_results_emit_at < self._results_emit_min_interval
        ):
            return

        records = store_rows_as_records(self._store)
        self._last_results_signature = signature
        self._last_results_emit_at = now
        self._callback(
            {
                "type": "results_updated",
                "count": len(records),
                "records": records,
            }
        )


def config_to_namespace(cfg: ScrapeRunConfig) -> argparse.Namespace:
    """Build the Namespace shape expected by existing pipeline stages."""
    # Discovery is Google Maps only.
    source = "gmaps"

    area = (cfg.area or "").strip()
    if cfg.search_all_localities:
        area_list = None
        areas = ""
    elif area:
        area_list = [area]
        areas = area
    else:
        area_list = []
        areas = ""

    out = cfg.out.strip()
    if not out:
        out = config.output_csv_path(cfg.city, cfg.business_type)

    return argparse.Namespace(
        city=cfg.city.strip() or config.DEFAULT_CITY,
        niche=cfg.business_type.strip() or config.DEFAULT_NICHE,
        target=max(config.MIN_TARGET, min(int(cfg.target), config.MAX_TARGET)),
        source=source,
        sources=source,
        areas=areas,
        area_list=area_list,
        out=out,
        db="",
        skip_websites=bool(cfg.skip_websites),
        engine=cfg.engine or "bing",
        concurrency=max(1, int(cfg.concurrency)),
        headful=bool(cfg.headful),
        max_scrolls=int(cfg.max_scrolls),
        max_queries=int(cfg.max_queries),
        website_limit=int(cfg.website_limit),
        enrich_limit=int(cfg.enrich_limit),
        retry_failed=bool(cfg.retry_failed),
        require=cfg.require or "any",
        verbose=True,
        yes=True,
    )


def store_rows_as_records(store: Store) -> list[dict[str, Any]]:
    """Serialize store rows into the public 18-column API/CSV shape."""
    records: list[dict[str, Any]] = []
    for index, row in enumerate(store._rows):  # noqa: SLF001 - intentional read for API
        emails = list(row.get("emails") or [])
        phones = list(row.get("phones") or [])
        from . import utils

        primary_email = utils.pick_primary_email(emails, row.get("website") or "")
        primary_phone = phones[0] if phones else ""
        records.append(
            {
                "id": str(row.get("id") or index + 1),
                "company_name": row.get("name") or "",
                "website": row.get("website") or "",
                "email_primary": primary_email,
                "emails_all": "; ".join(emails),
                "phone_primary": primary_phone,
                "phones_all": "; ".join(phones),
                "address": row.get("address") or "",
                "area": row.get("area") or "",
                "category": row.get("category") or "",
                "rating": "" if row.get("rating") is None else str(row.get("rating")),
                "review_count": (
                    "" if row.get("review_count") is None else str(row.get("review_count"))
                ),
                "linkedin": row.get("linkedin") or "",
                "facebook": row.get("facebook") or "",
                "instagram": row.get("instagram") or "",
                "sources": row.get("sources") or row.get("source") or "",
                "maps_url": row.get("maps_url") or "",
                "first_seen": row.get("first_seen") or "",
                "last_enriched": row.get("last_enriched") or "",
            }
        )
    return records


@dataclass
class ScrapeRunResult:
    csv_path: str
    records: list[dict[str, Any]]
    stats: dict[str, int]
    cancelled: bool = False


async def run_scrape(
    cfg: ScrapeRunConfig,
    event_callback: EventCallback | None = None,
    cancel_flag: threading.Event | None = None,
) -> ScrapeRunResult:
    """
    Run the real BizScrape pipeline programmatically.

    Does not install process-killing Ctrl+C handlers. Uses cooperative
    ``JobCancelled`` via ``cancel_flag`` for API jobs.
    """
    args = config_to_namespace(cfg)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)

    store = Store(args.out)
    hard_stop.register_store(store)
    hard_stop.set_job_cancel_flag(cancel_flag)

    stats = ui.RunStats(
        city=config.resolve_city(args.city)["label"],
        niche=str(args.niche),
        area=(cfg.area or "") or ("all localities" if cfg.search_all_localities else "entire city"),
        target=args.target,
        stored=store.count(),
    )
    dash = EventDashboard(stats, event_callback, store=store)

    if event_callback:
        event_callback({"type": "job_started", "stage": "discover"})

    cancelled = False
    try:
        await cmd_run(store, args, dash=dash)
        if event_callback:
            event_callback({"type": "stage_started", "stage": "deduplicate"})
            event_callback({"type": "stage_completed", "stage": "deduplicate"})
            event_callback({"type": "stage_started", "stage": "export"})
            records = store_rows_as_records(store)
            event_callback(
                {
                    "type": "results_updated",
                    "count": len(records),
                    "records": records,
                }
            )
            event_callback({"type": "csv_ready", "count": len(records)})
            event_callback({"type": "stage_completed", "stage": "export"})
            event_callback({"type": "job_completed", "count": len(records)})
    except hard_stop.JobCancelled:
        cancelled = True
        store.flush()
        if event_callback:
            records = store_rows_as_records(store)
            if records:
                event_callback(
                    {
                        "type": "results_updated",
                        "count": len(records),
                        "records": records,
                    }
                )
            event_callback({"type": "job_cancelled"})
    finally:
        hard_stop.set_job_cancel_flag(None)
        try:
            store.close()
        except Exception:
            pass

    return ScrapeRunResult(
        csv_path=args.out,
        records=store_rows_as_records(store),
        stats=store.stats(),
        cancelled=cancelled,
    )

"""
Pipeline stages: discover → websites → enrich → export.

Orchestration lives here so ``cli.py`` stays focused on argument parsing and UX.
Scraping selectors stay in ``sources/``, ``search/``, and ``enrichment/``.
"""

from __future__ import annotations

import argparse
import asyncio
from typing import Any

from . import config, geo, ui, utils
from . import shutdown as hard_stop
from .enrichment import SiteEnricher
from .sources import MapsScraper
from .store import Store


def resolve_areas(args: argparse.Namespace) -> list[str] | None:
    if getattr(args, "area_list", None) is not None:
        return args.area_list
    if args.areas:
        return [a.strip() for a in str(args.areas).split(",") if a.strip()]
    return None


def ingest(
    store: Store,
    records: list[dict],
    *,
    target: int,
    expected_area: str,
    city: str,
    stats: ui.RunStats | None = None,
) -> tuple[int, int, int]:
    """Validate area accuracy, upsert until target, return (added, kept, rejected)."""
    kept, rejected = geo.filter_records(records, expected_area, city=city)
    added = 0
    for record in kept:
        if store.count() >= target:
            break
        if store.upsert(record) == "new":
            added += 1
    if stats is not None:
        stats.kept += len(kept)
        stats.rejected += len(rejected)
        stats.stored = store.count()
        stats.found += len(records)
    return added, len(kept), len(rejected)


def preview_queries(args: argparse.Namespace) -> list[tuple[str, str]]:
    """Return the Maps query list that would be used (for --dry-run)."""
    city = getattr(args, "city", config.DEFAULT_CITY)
    areas = resolve_areas(args)
    queries = config.build_queries(args.niche, city=city, areas=areas)
    if getattr(args, "max_queries", None):
        queries = queries[: args.max_queries]
    return queries


async def stage_discover(
    store: Store,
    args: argparse.Namespace,
    dash: ui.Dashboard | None = None,
) -> None:
    await _discover_gmaps(store, args, dash=dash)
    store.flush()


async def _discover_gmaps(
    store: Store,
    args: argparse.Namespace,
    dash: ui.Dashboard | None = None,
) -> None:
    city = getattr(args, "city", config.DEFAULT_CITY)
    profile = config.resolve_city(city)
    areas = resolve_areas(args)
    queries = config.build_queries(args.niche, city=city, areas=areas)
    if args.max_queries:
        queries = queries[: args.max_queries]

    if store.count() >= args.target:
        ui.ok(f"Target already met ({store.count()}/{args.target})")
        return

    stats = dash.stats if dash else None
    if stats:
        stats.stage = "Google Maps"
        stats.queries_total = len(queries)
        stats.city = profile["label"]
        stats.niche = str(args.niche)
        if areas:
            stats.area = ", ".join(areas) if isinstance(areas, list) else "all localities"
        dash.refresh()

    ui.rule("Discover — Google Maps")
    ui.info(f"{profile['label']} · {len(queries)} queries · target {args.target}")

    max_scrolls = args.max_scrolls
    if args.target <= 50:
        max_scrolls = min(max_scrolls, 12)
    elif args.target <= 200:
        max_scrolls = min(max_scrolls, 24)

    try:
        async with MapsScraper(
            headless=not args.headful,
            max_scrolls=max_scrolls,
            verbose=False,
            city=city,
        ) as scraper:
            for index, (query, area) in enumerate(queries, start=1):
                hard_stop.check()
                if store.count() >= args.target:
                    ui.ok(f"Target of {args.target} reached")
                    break

                if stats:
                    stats.query = query
                    stats.queries_done = index
                    stats.stage = f"Maps {index}/{len(queries)}"
                    dash.refresh()

                try:
                    records = await scraper.search(query, area_hint=area)
                except Exception as exc:
                    hard_stop.check()
                    ui.warn(f"{query[:48]} → {type(exc).__name__}: {exc}")
                    continue

                hard_stop.check()
                added, kept, rejected = ingest(
                    store,
                    records,
                    target=args.target,
                    expected_area=area,
                    city=city,
                    stats=stats,
                )

                if area and kept < max(3, len(records) // 10) and store.count() < args.target:
                    hard_stop.check()
                    retry_q = geo.stricter_query(query, area, profile["label"])
                    if stats:
                        stats.retries += 1
                        stats.query = retry_q
                        stats.stage = f"Maps retry {index}/{len(queries)}"
                        dash.refresh()
                    try:
                        more = await scraper.search(retry_q, area_hint=area)
                    except Exception:
                        more = []
                    hard_stop.check()
                    a2, k2, r2 = ingest(
                        store,
                        more,
                        target=args.target,
                        expected_area=area,
                        city=city,
                        stats=stats,
                    )
                    added += a2
                    kept += k2
                    rejected += r2

                store.flush()
                hard_stop.check()
                if dash:
                    dash.refresh()
                    dash.log(
                        f"Maps [{index}/{len(queries)}] kept {kept}  "
                        f"rejected {rejected}  new {added}  total {store.count()}"
                    )
                else:
                    print(
                        f"  [{index}/{len(queries)}] {query[:46]:<46} "
                        f"kept {kept:>3}  reject {rejected:>3}  new {added:>3}  "
                        f"total {store.count():>4}",
                        flush=True,
                    )

                if store.count() >= args.target:
                    ui.ok(f"Target of {args.target} reached")
                    break
                await asyncio.sleep(utils.jitter(config.MAPS_DELAY))
                hard_stop.check()
    except RuntimeError as exc:
        ui.error(str(exc))
        raise


async def stage_websites(
    store: Store,
    args: argparse.Namespace,
    dash: ui.Dashboard | None = None,
) -> None:
    from .search import GoogleSearcher, WebSearcher

    rows = store.missing_website(limit=args.website_limit)
    if not rows:
        ui.ok("Every company already has a website")
        return

    city_label = config.resolve_city(getattr(args, "city", config.DEFAULT_CITY))["label"]
    if dash:
        dash.stats.stage = "Websites"
        dash.refresh()
    ui.rule(f"Websites — {len(rows)} lookups via {args.engine}")

    found = 0
    if args.engine == "google":
        searcher_cm: Any = GoogleSearcher(headless=not args.headful, verbose=False)
    else:
        searcher_cm = WebSearcher(engine=args.engine, verbose=False)

    try:
        async with searcher_cm as searcher:
            for index, row in enumerate(rows, start=1):
                hard_stop.check()
                hint = row["area"] or city_label
                try:
                    website = await searcher.find_website(row["name"], f"{hint} {city_label}")
                except Exception:
                    website = ""
                if website:
                    store.set_website(row["id"], website)
                    found += 1
                if index % 5 == 0:
                    store.flush()
                if dash:
                    dash.stats.query = row["name"]
                    dash.stats.stage = f"Websites {index}/{len(rows)}"
                    dash.refresh()
                if getattr(searcher, "blocked", False):
                    ui.warn("Search engine blocking — stopping early")
                    break
                hard_stop.check()
    except RuntimeError as exc:
        ui.warn(str(exc))
        return

    store.flush()
    ui.ok(f"Resolved {found}/{len(rows)} websites")


async def stage_enrich(
    store: Store,
    args: argparse.Namespace,
    dash: ui.Dashboard | None = None,
) -> None:
    rows = store.pending_enrichment(limit=args.enrich_limit, retry_failed=args.retry_failed)
    if not rows:
        ui.ok("Nothing pending for email crawl")
        return

    if dash:
        dash.stats.stage = "Enrich emails"
        dash.refresh()
    ui.rule(f"Enrich — {len(rows)} sites ({args.concurrency} parallel)")

    def on_result(company_id: int, result: dict) -> None:
        store.save_enrichment(company_id, result)
        if dash:
            dash.stats.emails += len(result.get("emails") or [])
            dash.refresh()
        if store.count() and company_id % 8 == 0:
            store.flush()

    targets = [(row["id"], row["name"], row["website"]) for row in rows]
    enricher = SiteEnricher(concurrency=args.concurrency, verbose=bool(not dash))
    counters = await enricher.run(targets, on_result=on_result)
    store.flush()
    ui.ok(
        f"Reachable {counters['done']}, unreachable {counters['failed']}, "
        f"emails found {counters['emails']}"
    )


def stage_export(store: Store, args: argparse.Namespace) -> None:
    written = store.export_csv(args.out, require=args.require)
    stats = store.stats()
    ui.rule("Done")
    print(f"  companies : {stats['total']}")
    print(f"  websites  : {stats['with_website']}")
    print(f"  phones    : {stats['with_phone']}")
    print(f"  emails    : {stats['with_email']}")
    print(f"  CSV       : {args.out}  ({written} rows)")
    print()
    if stats["total"] == 0:
        ui.warn(
            "No companies in the CSV. Try a broader niche, different area, "
            "or check that Google Maps returned results."
        )
    else:
        ui.ok(f"Saved to {args.out}")


async def cmd_run(
    store: Store,
    args: argparse.Namespace,
    dash: Any | None = None,
) -> None:
    """Run discover → websites → enrich → export.

    Pass ``dash`` to reuse an external progress sink (API event adapter).
    When ``dash`` is omitted, a Rich live dashboard is created (CLI default).
    """
    areas = resolve_areas(args)
    area_label = (
        ", ".join(areas)
        if isinstance(areas, list) and areas
        else ("all localities" if areas is None else "entire city")
    )
    stats = ui.RunStats(
        city=config.resolve_city(args.city)["label"],
        niche=str(args.niche),
        area=area_label,
        target=args.target,
        stored=store.count(),
    )

    async def _stages(active: Any) -> None:
        await stage_discover(store, args, dash=active)
        if not args.skip_websites:
            await stage_websites(store, args, dash=active)
        await stage_enrich(store, args, dash=active)

    if dash is not None:
        # Preserve caller-owned sink; sync stats object for stage updates.
        for field_name in (
            "city",
            "niche",
            "area",
            "target",
            "stored",
            "stage",
        ):
            setattr(dash.stats, field_name, getattr(stats, field_name))
        await _stages(dash)
    else:
        with ui.Dashboard(stats) as live:
            await _stages(live)
    stage_export(store, args)

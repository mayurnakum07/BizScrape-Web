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
    # Set active phone country from resolved city profile
    utils.set_phone_country(profile.get("country_code", "+1"))

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

    ui.rule("Discover - Google Maps")
    ui.info(f"{profile['label']} · {len(queries)} queries · target {args.target}")

    # Use sufficient scrolls so post-filtering and deduplication meet the target
    max_scrolls = max(args.max_scrolls, 25)

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

                # Blank query retry: if 0 cards returned, retry once with simplified phrasing
                if not records and store.count() < args.target:
                    clean_q = query.replace('"', '')
                    if " in " in clean_q:
                        p_cat, _, p_loc = clean_q.partition(" in ")
                        retry_blank = f"{p_cat.strip()} {p_loc.strip()}"
                    else:
                        retry_blank = f"{clean_q} {profile['label']}"
                    try:
                        records = await scraper.search(retry_blank, area_hint=area)
                    except Exception:
                        records = []

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

            # Fallback strategy: if queries exhausted and target not reached, broaden search
            if store.count() < args.target and not hard_stop.is_stopping():
                fallback_queries: list[tuple[str, str]] = []
                queried_phrases = {q[0] for q in queries}

                all_cats = config.niche_categories(args.niche)
                city_areas = list(profile.get("areas") or [])
                city_label = profile["label"]

                # 1. Any city localities not yet queried
                for area_name in city_areas:
                    for cat in all_cats:
                        fq = (f"{cat} in {area_name}, {city_label}", area_name)
                        if fq[0] not in queried_phrases:
                            fallback_queries.append(fq)
                            queried_phrases.add(fq[0])

                # 2. City-wide category variations
                for cat in all_cats:
                    fq = (f"{cat} in {city_label}", "")
                    if fq[0] not in queried_phrases:
                        fallback_queries.append(fq)
                        queried_phrases.add(fq[0])

                # 3. Compass / directional quadrants
                for quad in ("Downtown", "North", "South", "East", "West", "Central"):
                    for cat in all_cats:
                        fq = (f"{cat} in {quad} {city_label}", "")
                        if fq[0] not in queried_phrases:
                            fallback_queries.append(fq)
                            queried_phrases.add(fq[0])

                # 4. Modifiers & synonyms
                for cat in all_cats:
                    for mod in ("best", "top", "popular"):
                        fq = (f"{mod} {cat} in {city_label}", "")
                        if fq[0] not in queried_phrases:
                            fallback_queries.append(fq)
                            queried_phrases.add(fq[0])

                if fallback_queries:
                    for f_idx, (f_query, f_area) in enumerate(fallback_queries, start=1):
                        hard_stop.check()
                        if store.count() >= args.target:
                            ui.ok(f"Target of {args.target} reached")
                            break
                        if stats:
                            stats.query = f_query
                            stats.stage = f"Maps fallback {f_idx}/{len(fallback_queries)}"
                            dash.refresh()
                        try:
                            f_records = await scraper.search(f_query, area_hint=f_area)
                        except Exception:
                            continue
                        hard_stop.check()
                        ingest(
                            store,
                            f_records,
                            target=args.target,
                            expected_area=f_area,
                            city=city,
                            stats=stats,
                        )
                        store.flush()
                        if stats:
                            dash.refresh()
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

    user_limit = getattr(args, "website_limit", None)
    # Bounded limit (max 10) when 0 or unspecified to prevent multi-minute stalls
    limit = user_limit if (user_limit is not None and user_limit > 0) else 10
    rows = store.missing_website(limit=limit)
    if not rows:
        ui.ok("Every company already has a website")
        return

    city_label = config.resolve_city(getattr(args, "city", config.DEFAULT_CITY))["label"]
    if dash:
        dash.stats.stage = "Websites"
        dash.refresh()
    ui.rule(f"Websites - {len(rows)} lookups via {args.engine}")

    found = 0
    if args.engine == "google":
        searcher_cm: Any = GoogleSearcher(headless=not args.headful, verbose=False)
    else:
        searcher_cm = WebSearcher(engine=args.engine, delay=0.2, verbose=False)

    try:
        async with searcher_cm as searcher:
            concurrency = min(5, max(1, getattr(args, "concurrency", 5)))
            sem = asyncio.Semaphore(concurrency)

            async def _lookup(index: int, row: dict) -> None:
                nonlocal found
                async with sem:
                    if hard_stop.is_stopping() or getattr(searcher, "blocked", False):
                        return
                    hint = row.get("area") or city_label
                    try:
                        async with asyncio.timeout(6.0):
                            website = await searcher.find_website(row["name"], f"{hint} {city_label}")
                    except Exception:
                        website = ""
                    if website:
                        store.set_website(row["id"], website)
                        found += 1
                    if dash:
                        dash.stats.query = row["name"]
                        dash.stats.stage = f"Websites {index}/{len(rows)}"
                        dash.refresh()

            tasks = [_lookup(i, r) for i, r in enumerate(rows, start=1)]
            await asyncio.gather(*tasks)
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
    user_limit = getattr(args, "enrich_limit", None)
    # Bounded limit (max 10) when 0 or unspecified to prevent multi-minute stalls
    limit = user_limit if (user_limit is not None and user_limit > 0) else 10
    rows = store.pending_enrichment(limit=limit, retry_failed=args.retry_failed)
    if not rows:
        ui.ok("Nothing pending for email crawl")
        return

    if dash:
        dash.stats.stage = "Enrich emails"
        dash.refresh()
    ui.rule(f"Enrich - {len(rows)} sites ({args.concurrency} parallel)")

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

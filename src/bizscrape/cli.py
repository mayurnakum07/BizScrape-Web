"""
BizScrape CLI entry point.

Interactive:
    bizscrape run

Non-interactive:
    bizscrape run --city surat --niche it --areas "Mota Varachha" --target 50 --yes
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import traceback

from . import __version__, config, ui
from . import shutdown as hard_stop
from .errors import BizScrapeError, StorageError, UsageError
from .pipeline import (
    cmd_run,
    preview_queries,
    stage_discover,
    stage_enrich,
    stage_export,
    stage_websites,
)
from .store import Store

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

hard_stop.install()

_EPILOG = """
examples:
  bizscrape run
  bizscrape run --city surat --niche it --areas "Mota Varachha" --target 50 --yes
  bizscrape discover --city mumbai --niche food --target 20 --yes
  bizscrape enrich --concurrency 8
  bizscrape stats --out data/surat_it_2026-09-15.csv

exit codes:
  0  success
  1  application failure
  2  invalid usage
  130 interrupted (Ctrl+C)
"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bizscrape",
        description="BizScrape — scrape Indian city company contacts into a CSV.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=_EPILOG,
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--out",
        "--output",
        dest="out",
        default="",
        help="CSV output path (default: data/<city>_<niche>_YYYY-MM-DD.csv)",
    )
    parser.add_argument(
        "--db",
        default="",
        help="CSV path override (legacy flag name; no SQLite is used)",
    )
    parser.add_argument("--quiet", dest="verbose", action="store_false")

    sub = parser.add_subparsers(dest="command", required=True)

    def add_discover_flags(sp: argparse.ArgumentParser) -> None:
        sp.add_argument("--city", default=config.DEFAULT_CITY, help="City key or name")
        sp.add_argument("--niche", default=config.DEFAULT_NICHE, help="Niche key or custom phrase")
        sp.add_argument(
            "--target",
            type=int,
            default=config.DEFAULT_TARGET,
            help=f"Max companies to keep ({config.MIN_TARGET}–{config.MAX_TARGET})",
        )
        sp.add_argument(
            "--source",
            "--sources",
            dest="source",
            default="gmaps",
            help="Discovery source (only gmaps is supported)",
        )
        sp.add_argument("--areas", default="", help="Comma-separated localities")
        sp.add_argument("--max-queries", type=int, default=0, help="Cap Maps queries (0 = no cap)")
        sp.add_argument("--max-scrolls", type=int, default=40)
        sp.add_argument("--headful", action="store_true", help="Show browser windows")
        sp.add_argument("--redo", action="store_true")
        sp.add_argument(
            "--dry-run",
            action="store_true",
            help="Print planned Maps queries and exit without scraping",
        )

    def add_website_flags(sp: argparse.ArgumentParser, standalone: bool) -> None:
        sp.add_argument("--engine", default="bing", choices=["ddg", "bing", "google"])
        sp.add_argument(
            "--limit" if standalone else "--website-limit",
            dest="website_limit",
            type=int,
            default=0,
        )

    def add_enrich_flags(sp: argparse.ArgumentParser, standalone: bool) -> None:
        sp.add_argument("--concurrency", type=int, default=config.ENRICH_CONCURRENCY)
        sp.add_argument(
            "--limit" if standalone else "--enrich-limit",
            dest="enrich_limit",
            type=int,
            default=0,
        )
        sp.add_argument("--retry-failed", action="store_true")

    def add_export_flags(sp: argparse.ArgumentParser) -> None:
        sp.add_argument(
            "--require",
            default="any",
            choices=["any", "email", "phone", "contact", "both"],
        )

    discover = sub.add_parser(
        "discover",
        help="Find companies via Google Maps",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="example:\n  bizscrape discover --city surat --niche cafe --target 20 --yes",
    )
    add_discover_flags(discover)
    discover.add_argument("--yes", action="store_true", help="Non-interactive (no prompts)")

    websites = sub.add_parser(
        "websites",
        help="Find missing websites",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    add_website_flags(websites, standalone=True)
    websites.add_argument("--headful", action="store_true")
    websites.add_argument("--city", default=config.DEFAULT_CITY)

    enrich = sub.add_parser(
        "enrich",
        help="Crawl websites for public emails",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    add_enrich_flags(enrich, standalone=True)

    export = sub.add_parser(
        "export",
        help="Rewrite the CSV",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    add_export_flags(export)

    run = sub.add_parser(
        "run",
        help="Interactive full pipeline (or non-interactive with --yes)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  bizscrape run\n"
            '  bizscrape run --city surat --niche it --areas "Mota Varachha" '
            "--target 50 --yes"
        ),
    )
    add_discover_flags(run)
    add_website_flags(run, standalone=False)
    add_enrich_flags(run, standalone=False)
    add_export_flags(run)
    run.add_argument("--skip-websites", action="store_true")
    run.add_argument("--yes", action="store_true", help="Skip interactive wizard")

    sub.add_parser("stats", help="Show counts for the CSV")
    return parser


def validate_args(args: argparse.Namespace) -> None:
    """Raise UsageError before any browser/network work."""
    if hasattr(args, "target") and args.target is not None:
        if args.target < config.MIN_TARGET or args.target > config.MAX_TARGET:
            raise UsageError(
                f"target must be between {config.MIN_TARGET} and {config.MAX_TARGET} "
                f"(got {args.target}). Use --help to see valid options."
            )

    if hasattr(args, "source") and args.source is not None:
        parts = [s.strip().lower() for s in str(args.source).split(",") if s.strip()]
        # Legacy values that included justdial are coerced to Google Maps only.
        parts = ["gmaps" if p == "justdial" else p for p in parts]
        parts = [p for p in parts if p]
        allowed = {"gmaps"}
        bad = [p for p in parts if p not in allowed]
        if not parts or bad:
            raise UsageError(
                f"sources must be gmaps (got {args.source!r}). Justdial is no longer supported."
            )
        args.source = "gmaps"

    if hasattr(args, "concurrency") and args.concurrency is not None:
        if args.concurrency < 1 or args.concurrency > 64:
            raise UsageError("concurrency must be between 1 and 64.")


def _wizard_to_args(job: ui.JobConfig, base: argparse.Namespace) -> argparse.Namespace:
    base.city = job.city
    base.niche = job.niche
    base.target = job.target
    base.area_list = job.areas
    base.areas = ",".join(job.areas) if job.areas else ""
    base.out = job.out
    base.db = job.out
    base.skip_websites = job.skip_websites
    base.engine = job.engine
    base.source = job.source
    return base


def _ensure_paths(args: argparse.Namespace) -> None:
    city = getattr(args, "city", config.DEFAULT_CITY)
    niche = getattr(args, "niche", config.DEFAULT_NICHE)
    if not getattr(args, "out", None):
        args.out = config.output_csv_path(city, niche)
    if getattr(args, "db", None):
        args.out = args.db
    else:
        args.db = args.out
    if not hasattr(args, "area_list"):
        args.area_list = None


def _should_open_wizard(args: argparse.Namespace) -> bool:
    if args.command != "run" or getattr(args, "yes", False):
        return False
    explicit = any(
        flag in sys.argv
        for flag in ("--city", "--niche", "--yes", "--areas", "--source", "--sources")
    )
    return not explicit


def _print_dry_run(args: argparse.Namespace) -> None:
    queries = preview_queries(args)
    profile = config.resolve_city(args.city)
    ui.rule("Dry run — planned Maps queries")
    print(f"  city     : {profile['label']}")
    print(f"  niche    : {args.niche}")
    print(f"  target   : {args.target}")
    print(f"  sources  : {args.source}")
    print(f"  queries  : {len(queries)}")
    print()
    for index, (query, area) in enumerate(queries[:50], start=1):
        area_note = f"  [{area}]" if area else ""
        print(f"  {index:>3}. {query}{area_note}")
    if len(queries) > 50:
        print(f"  … and {len(queries) - 50} more")
    print()
    ui.ok("No network requests were made.")


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        code = exc.code
        return int(code) if isinstance(code, int) else (0 if code is None else 2)

    for field in ("website_limit", "enrich_limit", "max_queries"):
        if getattr(args, field, None) == 0:
            setattr(args, field, None)

    store: Store | None = None
    try:
        validate_args(args)

        if getattr(args, "dry_run", False) and args.command in ("run", "discover"):
            _ensure_paths(args)
            _print_dry_run(args)
            return 0

        if _should_open_wizard(args):
            job = ui.run_wizard()
            args = _wizard_to_args(job, args)
            validate_args(args)
        else:
            ui.print_banner()
            if args.command == "run" and not getattr(args, "out", None):
                args.out = config.output_csv_path(args.city, args.niche)

        _ensure_paths(args)
        store = Store(args.out)
        hard_stop.register_store(store)

        if args.command == "discover":
            asyncio.run(stage_discover(store, args))
            ui.ok(f"CSV now holds {store.count()} companies → {args.out}")
        elif args.command == "websites":
            asyncio.run(stage_websites(store, args))
        elif args.command == "enrich":
            asyncio.run(stage_enrich(store, args))
        elif args.command == "export":
            stage_export(store, args)
        elif args.command == "run":
            asyncio.run(cmd_run(store, args))
        elif args.command == "stats":
            for key, value in store.stats().items():
                print(f"  {key.replace('_', ' '):<20} {value}")
            print(f"  csv                  {args.out}")
        return 0

    except UsageError as exc:
        ui.error(str(exc))
        return exc.exit_code

    except KeyboardInterrupt:
        hard_stop.force_exit(130)
        return 130

    except StorageError as exc:
        ui.error(str(exc))
        return 1

    except BizScrapeError as exc:
        ui.error(str(exc))
        return exc.exit_code

    except RuntimeError as exc:
        ui.error(str(exc))
        return 1

    except Exception as exc:
        ui.error(f"Unexpected error: {type(exc).__name__}: {exc}")
        if getattr(args, "verbose", True):
            traceback.print_exc()
        if store is not None:
            try:
                store.flush()
                ui.info(f"Partial CSV saved → {store.path}")
            except Exception:
                pass
        return 1

    finally:
        if store is not None:
            try:
                store.close()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())

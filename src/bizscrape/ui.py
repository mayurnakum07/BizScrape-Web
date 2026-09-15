"""
Interactive wizard + live scraping dashboard (Rich when available).
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass, field
from typing import Any

from . import config

try:
    from rich.console import Console
    from rich.live import Live
    from rich.panel import Panel
    from rich.progress import (
        BarColumn,
        Progress,
        SpinnerColumn,
        TaskProgressColumn,
        TextColumn,
        TimeElapsedColumn,
    )
    from rich.table import Table
    from rich.text import Text
    from rich.theme import Theme

    _RICH = True
except ImportError:  # pragma: no cover
    _RICH = False


# --- colour helpers (fallback) ----------------------------------------------


def _supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("FORCE_COLOR"):
        return True
    return sys.stdout.isatty()


_COLOR = _supports_color()
_console = (
    Console(
        theme=Theme(
            {
                "ok": "bold green",
                "warn": "bold yellow",
                "err": "bold red",
                "muted": "dim",
                "accent": "cyan",
            }
        ),
        highlight=False,
    )
    if _RICH
    else None
)


def _c(code: str, text: str) -> str:
    if not _COLOR or _RICH:
        return text if not _RICH else text
    return f"\033[{code}m{text}\033[0m"


def bold(text: str) -> str:
    return f"[bold]{text}[/bold]" if _RICH else _c("1", text)


def dim(text: str) -> str:
    return f"[muted]{text}[/muted]" if _RICH else _c("2", text)


def cyan(text: str) -> str:
    return f"[accent]{text}[/accent]" if _RICH else _c("36", text)


def green(text: str) -> str:
    return f"[ok]{text}[/ok]" if _RICH else _c("32", text)


def yellow(text: str) -> str:
    return f"[warn]{text}[/warn]" if _RICH else _c("33", text)


def red(text: str) -> str:
    return f"[err]{text}[/err]" if _RICH else _c("31", text)


def print_banner() -> None:
    title = (
        Text.from_markup(
            "[bold cyan]BizScrape[/bold cyan]  [dim]Indian city company scraper[/dim]\n"
            "[dim]Google Maps → websites → emails → CSV[/dim]"
        )
        if _RICH
        else None
    )
    if _RICH and _console:
        _console.print(Panel(title, border_style="cyan", padding=(1, 2)))
    else:
        print(
            "\n+======================================================================+\n"
            "|  BizScrape — Google Maps → websites → emails → CSV                 |\n"
            "+======================================================================+\n",
            flush=True,
        )


def rule(title: str = "") -> None:
    if _RICH and _console:
        _console.rule(f"[bold]{title}[/bold]" if title else "")
    else:
        line = "-" * 70
        print(f"\n{title}\n{line}" if title else line, flush=True)


def info(message: str) -> None:
    if _RICH and _console:
        _console.print(f"  [muted]i[/muted]  {message}")
    else:
        print(f"  i  {message}", flush=True)


def ok(message: str) -> None:
    if _RICH and _console:
        _console.print(f"  [ok]OK[/ok]  {message}")
    else:
        print(f"  OK  {message}", flush=True)


def warn(message: str) -> None:
    if _RICH and _console:
        _console.print(f"  [warn]![/warn]  {message}")
    else:
        print(f"  !  {message}", flush=True)


def error(message: str) -> None:
    if _RICH and _console:
        _console.print(f"  [err]X[/err]  {message}")
    else:
        print(f"  X  {message}", flush=True)


def _readline(prompt: str) -> str:
    try:
        if _RICH and _console:
            return _console.input(prompt)
        return input(prompt)
    except EOFError:
        return ""


def ask_text(prompt: str, default: str = "", allow_empty: bool = False) -> str:
    suffix = f" [{default}]" if default else ""
    while True:
        raw = _readline(f"  {prompt}{suffix}: ").strip()
        if not raw:
            if default:
                return default
            if allow_empty:
                return ""
            warn("Please enter a value (or Ctrl+C to quit).")
            continue
        return raw


def ask_int(prompt: str, default: int, minimum: int = 1, maximum: int = 50_000) -> int:
    while True:
        raw = ask_text(prompt, default=str(default), allow_empty=False)
        try:
            value = int(raw.replace(",", "").strip())
        except ValueError:
            warn("Enter a whole number.")
            continue
        if value < minimum or value > maximum:
            warn(f"Pick a number between {minimum} and {maximum}.")
            continue
        return value


def ask_choice(
    prompt: str,
    options: list[tuple[str, str]],
    *,
    custom_label: str | None = "Type my own",
) -> str:
    print()
    if _RICH and _console:
        _console.print(f"  [bold]{prompt}[/bold]")
    else:
        print(f"  {prompt}", flush=True)

    for index, (_key, label) in enumerate(options, start=1):
        if _RICH and _console:
            _console.print(f"    [accent]{index}[/accent]) {label}")
        else:
            print(f"    {index}) {label}", flush=True)

    custom_index = None
    if custom_label:
        custom_index = len(options) + 1
        if _RICH and _console:
            _console.print(f"    [accent]{custom_index}[/accent]) {custom_label}")
        else:
            print(f"    {custom_index}) {custom_label}", flush=True)

    while True:
        raw = ask_text("Choice", default="1")
        if not raw.isdigit():
            lowered = raw.strip().lower()
            for key, label in options:
                if lowered in {key.lower(), label.lower(), config.slugify(label)}:
                    return key
            if custom_label and lowered:
                return raw.strip()
            warn("Enter a number from the list.")
            continue

        choice = int(raw)
        if 1 <= choice <= len(options):
            return options[choice - 1][0]
        if custom_index is not None and choice == custom_index:
            return ask_text("Enter your own", allow_empty=False)
        warn(f"Pick 1–{custom_index or len(options)}.")


# --- live dashboard ----------------------------------------------------------


@dataclass
class RunStats:
    city: str = ""
    niche: str = ""
    area: str = ""
    target: int = 0
    stage: str = "Starting"
    query: str = ""
    queries_done: int = 0
    queries_total: int = 0
    found: int = 0
    kept: int = 0
    rejected: int = 0
    retries: int = 0
    emails: int = 0
    stored: int = 0
    started: float = field(default_factory=time.time)

    @property
    def elapsed(self) -> str:
        seconds = int(time.time() - self.started)
        return f"{seconds // 60}m {seconds % 60:02d}s"


class Dashboard:
    """Claude Code / Codex style live panel while scraping."""

    def __init__(self, stats: RunStats):
        self.stats = stats
        self._live: Any = None
        self._progress: Any = None
        self._task_id: Any = None

    def __enter__(self) -> Dashboard:
        if _RICH and _console:
            self._progress = Progress(
                SpinnerColumn(),
                TextColumn("[bold]{task.description}"),
                BarColumn(bar_width=28),
                TaskProgressColumn(),
                TimeElapsedColumn(),
                console=_console,
                transient=False,
            )
            self._task_id = self._progress.add_task("discover", total=max(1, self.stats.target))
            # transient=False, screen=False so Ctrl+C is not swallowed by Live.
            self._live = Live(
                self._render(),
                console=_console,
                refresh_per_second=6,
                redirect_stdout=False,
                redirect_stderr=False,
            )
            self._live.__enter__()
        return self

    def __exit__(self, *exc: object) -> None:
        self.refresh()
        if self._live:
            self._live.__exit__(*exc)

    def _render(self):
        s = self.stats
        table = Table.grid(padding=(0, 2))
        table.add_column(style="dim", justify="right")
        table.add_column()
        table.add_row("City", f"[bold]{s.city}[/bold]")
        table.add_row("Niche", s.niche)
        table.add_row("Area", s.area or "entire city")
        table.add_row("Stage", f"[accent]{s.stage}[/accent]")
        table.add_row("Query", (s.query[:54] + "…") if len(s.query) > 55 else s.query)
        table.add_row(
            "Progress",
            f"[ok]{s.stored}[/ok]/[bold]{s.target}[/bold] stored   "
            f"kept {s.kept}   rejected {s.rejected}   retries {s.retries}",
        )
        table.add_row("Emails", str(s.emails))
        table.add_row("Time", s.elapsed)

        if self._progress and self._task_id is not None:
            self._progress.update(
                self._task_id,
                completed=min(s.stored, max(1, s.target)),
                total=max(1, s.target),
                description=s.stage,
            )
            layout = Table.grid()
            layout.add_row(
                Panel(table, title="[bold cyan]BizScrape[/bold cyan]", border_style="cyan")
            )
            layout.add_row(self._progress)
            return layout

        return Panel(table, title="BizScrape", border_style="cyan")

    def refresh(self) -> None:
        if self._live:
            self._live.update(self._render())
        elif not _RICH:
            s = self.stats
            print(
                f"\r  [{s.stage}] {s.stored}/{s.target}  "
                f"kept {s.kept}  rejected {s.rejected}  {s.query[:40]}",
                end="",
                flush=True,
            )

    def log(self, message: str) -> None:
        if _RICH and _console:
            _console.print(f"  [dim]›[/dim] {message}")
        else:
            print(f"\n  > {message}", flush=True)


# --- wizard ------------------------------------------------------------------


@dataclass
class JobConfig:
    city: str = config.DEFAULT_CITY
    city_label: str = "Surat"
    niche: str = config.DEFAULT_NICHE
    niche_label: str = "IT / Software companies"
    areas: list[str] | None = field(default_factory=list)
    target: int = config.DEFAULT_TARGET
    source: str = "gmaps"
    skip_websites: bool = False
    engine: str = "bing"
    out: str = ""
    db: str = ""
    interactive: bool = True


def run_wizard() -> JobConfig:
    print_banner()
    rule("Step 1 — What data do you need?")

    niche_options = [(key, config.NICHE_LABELS.get(key, key.title())) for key in config.NICHES]
    niche = ask_choice("Business type", niche_options, custom_label="Type my own search phrase")
    if niche in config.NICHES:
        niche_label = config.NICHE_LABELS.get(niche, niche)
    else:
        niche_label = niche
        info(f"Custom search phrase: {niche_label}")

    rule("Step 2 — Which city?")
    city_options = [(key, profile["label"]) for key, profile in config.CITIES.items()]
    city = ask_choice("City", city_options, custom_label="Other city (type name)")
    profile = config.resolve_city(city)
    city_key = profile["key"]
    city_label = profile["label"]

    rule("Step 3 — Area / town (optional)")
    known_areas = profile.get("areas") or []
    if known_areas:
        preview = ", ".join(known_areas[:8])
        info(f"Known areas include: {preview}…")
        info("Type a town for accurate local results (e.g. Mota Varachha).")
        info("Leave blank to search the whole city.")
    else:
        info("Type a locality, or leave blank for the whole city.")

    area_raw = ask_text(
        "Area (comma-separated, or Enter to skip)",
        default="",
        allow_empty=True,
    )
    areas = [part.strip() for part in area_raw.split(",") if part.strip()]

    if not areas and known_areas:
        sweep = ask_text(
            "Sweep all known localities for more results? (Y/n)",
            default="n",
            allow_empty=False,
        )
        if sweep.lower() in {"y", "yes"}:
            areas = None
            info(f"Will sweep {len(known_areas)} localities across {city_label}.")
        else:
            areas = []
            info("City-wide search (results may mix neighbourhoods).")
    elif not areas:
        areas = []

    rule("Step 4 — How many companies?")
    target = ask_int("Target count", default=config.DEFAULT_TARGET, minimum=5, maximum=20_000)

    out = config.output_csv_path(city_key, niche)
    job = JobConfig(
        city=city_key,
        city_label=city_label,
        niche=niche if niche in config.NICHES else niche,
        niche_label=niche_label,
        areas=areas,
        target=target,
        source="gmaps",
        out=out,
        db=out,
        interactive=True,
    )

    rule("Ready")
    if _RICH and _console:
        summary = Table.grid(padding=(0, 2))
        summary.add_column(style="dim")
        summary.add_column()
        summary.add_row("City", f"[bold]{job.city_label}[/bold]")
        summary.add_row("Niche", job.niche_label)
        if job.areas is None:
            area_text = "all known localities"
        elif job.areas:
            area_text = ", ".join(job.areas)
        else:
            area_text = "entire city"
        summary.add_row("Areas", area_text)
        summary.add_row("Source", "Google Maps")
        summary.add_row("Target", str(job.target))
        summary.add_row("CSV", f"[ok]{job.out}[/ok]")
        _console.print(Panel(summary, border_style="green", title="Job"))
    else:
        print(f"  City      : {job.city_label}")
        print(f"  Niche     : {job.niche_label}")
        print(f"  CSV out   : {job.out}")

    confirm = ask_text("Start scraping? (Y/n)", default="Y", allow_empty=False)
    if confirm.lower() in {"n", "no"}:
        raise KeyboardInterrupt
    return job

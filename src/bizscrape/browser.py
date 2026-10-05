"""
Shared Playwright browser launch with safe fallbacks.

Bundled Chromium is often missing after a fresh pip install (or blocked by
sandbox paths). Prefer the user's installed Chrome / Edge, then fall back to
Playwright's Chromium, and finally raise a clear actionable error.
"""

from __future__ import annotations

from typing import Any

from playwright.async_api import Browser, Playwright
from playwright.async_api import Error as PlaywrightError

INSTALL_HINT = (
    "No usable browser found.\n"
    "  Fix either of these:\n"
    "    1) Install Google Chrome or Microsoft Edge, then retry\n"
    "    2) python -m playwright install chromium"
)

# Prefer system browsers - they do not need the Playwright download cache.
_CHANNEL_ORDER = ("chrome", "msedge", "chromium")


async def launch_browser(
    playwright: Playwright,
    *,
    headless: bool = True,
    preferred_channel: str | None = None,
    extra_args: list[str] | None = None,
) -> tuple[Browser, str]:
    """
    Launch a Chromium-family browser.

    Returns (browser, label) where label is useful for logs
    ('chrome', 'msedge', 'chromium', ...).
    """
    import os, sys

    is_container = os.path.exists("/.dockerenv") or bool(os.getenv("CONTAINER") or os.getenv("DOCKER"))
    args = [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
    ]
    if is_container or sys.platform.startswith("linux"):
        args.append("--no-sandbox")
    if extra_args:
        args.extend(extra_args)

    channels: list[str | None] = []
    if preferred_channel:
        channels.append(preferred_channel)
    for channel in _CHANNEL_ORDER:
        if channel not in channels:
            channels.append(channel)
    # Last resort: bundled Chromium with no channel flag.
    if None not in channels:
        channels.append(None)

    errors: list[str] = []
    for channel in channels:
        try:
            kwargs: dict[str, Any] = {"headless": headless, "args": args}
            if channel:
                kwargs["channel"] = channel
            browser = await playwright.chromium.launch(**kwargs)
            label = channel or "chromium"
            return browser, label
        except PlaywrightError as exc:
            errors.append(f"{channel or 'chromium'}: {exc}")
            continue

    detail = "\n".join(f"    - {item}" for item in errors[:4])
    raise RuntimeError(f"{INSTALL_HINT}\n  Attempts:\n{detail}")

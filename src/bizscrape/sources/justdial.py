"""
Justdial discovery via a real (non-headless) browser.

Justdial actively blocks automation: bundled Chromium gets an HTTP/2 reset and
plain HTTP requests receive an empty '<HTML></HTML>' body. A headful Edge or
Chrome profile does get through, which is why this source is opt-in and cannot
run headless.

What Justdial actually yields is names, localities and categories. It publishes
no emails, and phone numbers sit behind a per-listing 'Show Number' click that
triggers a login wall when repeated. Its real value in this pipeline is feeding
company names to the website-lookup stage, which then produces emails.
"""

from __future__ import annotations

import json
import re

from playwright.async_api import Error as PlaywrightError
from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright

from .. import utils

_COLLECT_CARDS_JS = """
() => {
  const out = [];
  document.querySelectorAll('.resultbox').forEach(el => {
    const label = el.getAttribute('aria-label') || '';
    const docid = el.getAttribute('id') || '';
    if (!docid) return;

    const titled = el.querySelector('[title]');
    const anchor = el.querySelector('a[href*="_BZDET"]');

    out.push({
      docid: docid,
      label: label,
      title: titled ? titled.getAttribute('title') : '',
      url: anchor ? anchor.href : '',
      text: el.innerText || '',
    });
  });
  return out;
}
"""

_LD_JSON_JS = """
() => Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
       .map(s => s.textContent || '')
"""

_CARD_COUNT_JS = "() => document.querySelectorAll('.resultbox').length"

_ARIA_NAME_RE = re.compile(r"(?i)^(?:contract|contact)\s+info\s+of\s+(.+)$")
_RATING_RE = re.compile(r"^([0-5](?:\.\d)?)$")
_RATINGS_COUNT_RE = re.compile(r"(?i)^([\d,]+)\s*Ratings?$")

# Card lines that are buttons or badges rather than business data.
_CARD_NOISE = {
    "show number",
    "whatsapp",
    "get best price",
    "in business",
    "enquire now",
    "send enquiry",
    "chat",
    "book now",
    "verified",
    "trust",
    "top search",
    "responsive",
    "claim this business",
    "share",
    "rate now",
    "call now",
    "best deal",
    "popular",
    "jd verified",
    "view number",
}


class JustdialScraper:
    """Async context manager that drives a headful browser against Justdial."""

    def __init__(
        self,
        channel: str = "msedge",
        headless: bool = False,
        max_scrolls: int = 25,
        verbose: bool = True,
    ):
        self.channel = channel
        # Justdial's bot check rejects headless engines outright.
        self.headless = headless
        self.max_scrolls = max_scrolls
        self.verbose = verbose
        self.blocked = False
        self._playwright = None
        self._browser = None
        self._page = None

    async def __aenter__(self) -> JustdialScraper:
        self._playwright = await async_playwright().start()
        self._browser = await self._launch()
        context = await self._browser.new_context(
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            viewport={"width": 1400, "height": 900},
        )
        self._page = await context.new_page()
        self._page.set_default_timeout(45_000)
        return self

    async def _launch(self):
        """Prefer a real browser channel; bundled Chromium is always blocked."""
        attempts = [self.channel, "msedge", "chrome", None]
        seen: list[str | None] = []
        last_error: Exception | None = None

        for channel in attempts:
            if channel in seen:
                continue
            seen.append(channel)
            try:
                kwargs = {
                    "headless": self.headless,
                    "args": ["--disable-blink-features=AutomationControlled"],
                }
                if channel:
                    kwargs["channel"] = channel
                browser = await self._playwright.chromium.launch(**kwargs)
                if self.verbose:
                    print(f"  Justdial browser: {channel or 'bundled chromium'}", flush=True)
                return browser
            except PlaywrightError as exc:
                last_error = exc
                continue

        raise RuntimeError(f"could not launch a browser for Justdial: {last_error}")

    async def __aexit__(self, *_exc: object) -> None:
        try:
            if self._browser:
                await self._browser.close()
        except PlaywrightError:
            pass
        if self._playwright:
            await self._playwright.stop()

    # --- scraping -----------------------------------------------------------

    async def scrape_category(
        self, category_slug: str, city: str = "Surat", max_results: int = 200
    ) -> list[dict]:
        """Scroll one Justdial category listing and return its businesses."""
        url = f"https://www.justdial.com/{city}/{category_slug}"

        try:
            await self._page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        except (PlaywrightError, PlaywrightTimeout) as exc:
            if self.verbose:
                print(f"  ! Justdial blocked the request ({type(exc).__name__})", flush=True)
            self.blocked = True
            return []

        if not await self._wait_for_results():
            return []

        await self._scroll(max_results)

        try:
            cards = await self._page.evaluate(_COLLECT_CARDS_JS)
            ld_blocks = await self._page.evaluate(_LD_JSON_JS)
        except PlaywrightError:
            return []

        addresses = _addresses_from_json_ld(ld_blocks)
        label = category_slug.replace("-", " ")

        records = []
        for card in cards[:max_results]:
            record = _card_to_record(card, addresses, label, city)
            if record:
                records.append(record)
        return records

    async def _wait_for_results(self) -> bool:
        for _ in range(12):
            try:
                if await self._page.evaluate(_CARD_COUNT_JS) > 2:
                    return True
                html = await self._page.content()
            except PlaywrightError:
                self.blocked = True
                return False

            # The signature of Justdial's bot response is a near-empty document.
            if len(html) < 2000:
                self.blocked = True
                if self.verbose:
                    print("  ! Justdial served an empty page (bot detection)", flush=True)
                return False
            await self._page.wait_for_timeout(2000)

        if self.verbose:
            print("  ! Justdial results never appeared", flush=True)
        return False

    async def _scroll(self, max_results: int) -> None:
        previous = 0
        stable = 0
        for _ in range(self.max_scrolls):
            try:
                count = await self._page.evaluate(_CARD_COUNT_JS)
                if count >= max_results:
                    return
                await self._page.mouse.wheel(0, 4000)
                await self._page.wait_for_timeout(1400)
            except PlaywrightError:
                return

            if count == previous:
                stable += 1
                if stable >= 3:
                    return
            else:
                stable = 0
            previous = count


def _addresses_from_json_ld(blocks: list[str]) -> dict[str, str]:
    """Map company name -> postal address from the page's JSON-LD blocks."""
    addresses: dict[str, str] = {}

    for raw in blocks:
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            continue

        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict) or item.get("@type") != "LocalBusiness":
                continue
            name = utils.clean_text(item.get("name"))
            address = item.get("address")
            if not name or not isinstance(address, dict):
                continue

            parts = [
                address.get("streetAddress"),
                address.get("addressLocality"),
                address.get("addressRegion"),
                address.get("postalCode"),
            ]
            joined = ", ".join(utils.clean_text(part) for part in parts if part)
            if joined:
                addresses[name.lower()] = joined

    return addresses


def _card_to_record(card: dict, addresses: dict[str, str], category: str, city: str) -> dict | None:
    name = ""
    match = _ARIA_NAME_RE.match(utils.clean_text(card.get("label")))
    if match:
        name = utils.clean_text(match.group(1))

    lines = [utils.clean_text(line) for line in (card.get("text") or "").split("\n")]
    lines = [line for line in lines if line]
    if not name and lines:
        name = lines[0]
    if not name:
        return None

    rating: float | None = None
    review_count: int | None = None
    area = ""
    detail_category = ""

    for line in lines[1:]:
        lowered = line.lower()
        if lowered in _CARD_NOISE:
            continue
        if rating is None and _RATING_RE.match(line):
            rating = float(line)
            continue
        count_match = _RATINGS_COUNT_RE.match(line)
        if count_match and review_count is None:
            review_count = int(count_match.group(1).replace(",", ""))
            continue
        if re.match(r"(?i)^\d+\s*years?$", line):
            continue
        if not area and lowered not in (city.lower(),) and len(line) < 60:
            if "compan" in lowered or "service" in lowered or "dealer" in lowered:
                detail_category = detail_category or line
            else:
                area = line

    # The title attribute reads "Company Name  Locality, City".
    address = addresses.get(name.lower(), "")
    if not address:
        title = utils.clean_text(card.get("title"))
        if title.lower().startswith(name.lower()):
            remainder = utils.clean_text(title[len(name) :])
            if remainder:
                address = remainder
    if not address and area:
        address = f"{area}, {city}"

    if not area and address:
        area = utils.infer_area(address) or address.split(",")[0].strip()

    phones = utils.extract_phones(card.get("text") or "")

    return {
        "name": name,
        "website": "",  # Justdial never links a company's own site
        "address": address,
        "area": area,
        "category": detail_category or category,
        "rating": rating,
        "review_count": review_count,
        "phones": phones,
        "emails": [],
        "maps_url": "",
        "justdial_url": card.get("url", ""),
        "source": "justdial",
    }

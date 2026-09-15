"""
Google Maps discovery via Playwright.

Maps is the only one of the three sources that reliably hands over a company's
name, phone and website together. It caps each search at roughly 120 results,
so breadth comes from running many category x locality queries rather than
paginating a single one.
"""

from __future__ import annotations

import asyncio
import re
from urllib.parse import quote_plus

from playwright.async_api import Error as PlaywrightError
from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright

from .. import config, utils
from .. import shutdown as hard_stop
from ..browser import launch_browser

# Runs inside the page: returns one entry per result card in the feed.
_COLLECT_CARDS_JS = """
() => {
  const feed = document.querySelector('div[role="feed"]');
  if (!feed) return [];
  const seen = new Set();
  const out = [];

  for (const anchor of feed.querySelectorAll('a[href*="/maps/place/"]')) {
    const href = anchor.href;
    if (seen.has(href)) continue;
    seen.add(href);

    // The clickable overlay sits directly inside the card; climb until the
    // element actually carries the card's text.
    let card = anchor.parentElement;
    for (let i = 0; i < 4 && card && (card.innerText || '').trim().length < 5; i++) {
      card = card.parentElement;
    }
    if (!card) continue;

    let website = '';
    const siteLink = card.querySelector('a[data-value="Website"]')
      || card.querySelector('a[aria-label^="Visit"]');
    if (siteLink) website = siteLink.href || '';

    let ratingLabel = '';
    const ratingEl = card.querySelector('span[role="img"][aria-label]');
    if (ratingEl) ratingLabel = ratingEl.getAttribute('aria-label') || '';

    out.push({
      name: anchor.getAttribute('aria-label') || '',
      maps_url: href,
      website: website,
      rating_label: ratingLabel,
      text: card.innerText || '',
    });
  }
  return out;
}
"""

# Runs on an opened place page (deep mode) where Google exposes exact values
# through data-item-id attributes that have been stable for years.
_COLLECT_PLACE_JS = """
() => {
  const pick = (selector, attribute) => {
    const el = document.querySelector(selector);
    if (!el) return '';
    return attribute ? (el.getAttribute(attribute) || '') : (el.textContent || '');
  };

  const phoneButton = document.querySelector('button[data-item-id^="phone:tel:"]');
  const phone = phoneButton
    ? (phoneButton.getAttribute('data-item-id') || '').replace('phone:tel:', '')
    : '';

  return {
    name: pick('h1'),
    website: pick('a[data-item-id="authority"]', 'href'),
    phone: phone,
    address: pick('button[data-item-id="address"]', 'aria-label').replace(/^Address:\\s*/, ''),
    category: pick('button[jsaction*="category"]'),
  };
}
"""

_END_OF_LIST_JS = """
() => (document.body.innerText || '').includes("reached the end of the list")
"""

_CARD_COUNT_JS = """
() => document.querySelectorAll('div[role="feed"] a[href*="/maps/place/"]').length
"""

_RATING_RE = re.compile(
    r"([0-5](?:[.,]\d)?)\s*(?:stars?|star)?\s*(?:\(?([\d,]+)\)?\s*(?:reviews?|Reviews?)?)?"
)
_INLINE_RATING_RE = re.compile(r"^\s*([0-5][.,]\d)\s*\(([\d,]+)\)\s*$")

# Depending on whether a card carries a photo, Google renders the score and the
# review count either together as '4.8(112)' or on two separate lines.
_BARE_RATING_RE = re.compile(r"^[0-5][.,]\d$")
_REVIEW_COUNT_RE = re.compile(r"^\(\s*[\d,]+\s*\)$")
_NO_REVIEWS_RE = re.compile(r"(?i)^no reviews?$")

# Google separates a card's fields with a middle dot, but uses several
# codepoints for it depending on context.
_DOT_SEPARATORS = ("\u00b7", "\u22c5", "\u2022")

# Segments that describe opening hours, actions or distance rather than the
# business itself.
_NOISE_SEGMENT_RE = re.compile(
    r"(?i)^(open|closed|closes|opens|temporarily closed|permanently closed|"
    r"open 24 hours|opens soon|closes soon|24 hours|directions|website|call|"
    r"share|save|nearby|order online|reserve a table|menu|book online|"
    r"view menu|dine-in|takeaway|delivery|in-store shopping|sponsored|ad\b|"
    r"visit site|wheelchair|on-?site services|online appointments|"
    r"online estimates|identifies as|small business|\d+\+? years? in business|"
    r"\d+(\.\d+)? ?(km|mi|m)\b|"
    r"(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b)"
)

# Standalone card lines that are pure UI chrome.
_CARD_ACTION_WORDS = {
    "website",
    "directions",
    "call",
    "share",
    "save",
    "order online",
    "menu",
    "reserve a table",
    "book online",
    "sponsored",
    "ad",
    "visit site",
}

# Words that mark a segment as a street address rather than a category.
_ADDRESS_HINT_RE = re.compile(
    r"(?i)\b(road|rd|marg|street|st|lane|ln|floor|flr|opp|opposite|near|nr|"
    r"nagar|society|soc|complex|plaza|hub|tower|chowk|circle|char rasta|"
    r"gam|park|point|arcade|mall|building|bldg|block|sector|gidc|highway|"
    r"cross|char|residency|apartment|estate|market|char-rasta|no\.)\b"
)


class MapsScraper:
    """Async context manager owning one browser for the whole discovery run."""

    def __init__(
        self,
        headless: bool = True,
        block_assets: bool = True,
        max_scrolls: int = 40,
        scroll_pause: float = 1.1,
        verbose: bool = True,
        city: str = config.DEFAULT_CITY,
        channel: str | None = None,
    ):
        self.headless = headless
        self.block_assets = block_assets
        self.max_scrolls = max_scrolls
        self.scroll_pause = scroll_pause
        self.verbose = verbose
        self.city_profile = config.resolve_city(city)
        self.channel = channel
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None

    async def __aenter__(self) -> MapsScraper:
        self._playwright = await async_playwright().start()
        try:
            self._browser, used = await launch_browser(
                self._playwright,
                headless=self.headless,
                preferred_channel=self.channel,
            )
        except RuntimeError:
            await self._playwright.stop()
            self._playwright = None
            raise

        self._log(f"  [browser] using {used}")
        latitude, longitude = self.city_profile["center"]
        self._context = await self._browser.new_context(
            user_agent=utils.random_user_agent(),
            viewport={"width": 1440, "height": 900},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            geolocation={"latitude": latitude, "longitude": longitude},
            permissions=["geolocation"],
        )
        # Maps renders results as DOM text; images and fonts are pure overhead.
        if self.block_assets:
            await self._context.route(
                re.compile(r"\.(png|jpe?g|gif|webp|svg|woff2?|ttf|mp4|ico)(\?|$)"),
                lambda route: asyncio.ensure_future(route.abort()),
            )
        self._page = await self._context.new_page()
        self._page.set_default_timeout(30_000)
        return self

    async def __aexit__(self, *_exc: object) -> None:
        for closer in (self._context, self._browser):
            try:
                if closer:
                    await closer.close()
            except PlaywrightError:
                pass
        if self._playwright:
            try:
                await self._playwright.stop()
            except Exception:
                pass

    # --- internals ----------------------------------------------------------

    def _log(self, message: str) -> None:
        if self.verbose:
            print(message, flush=True)

    async def _dismiss_consent(self) -> None:
        """Google's cookie wall blocks the feed until it is answered."""
        for label in ("Accept all", "Reject all", "I agree", "Accept"):
            try:
                button = self._page.get_by_role("button", name=label, exact=False)
                if await button.count():
                    await button.first.click(timeout=3000)
                    await self._page.wait_for_timeout(1500)
                    return
            except (PlaywrightError, PlaywrightTimeout):
                continue

    async def _scroll_feed(self) -> int:
        """Scroll the results panel until Google stops adding cards."""
        previous_count = 0
        stable_rounds = 0

        for _ in range(self.max_scrolls):
            if hard_stop.is_stopping():
                break
            try:
                await self._page.evaluate(
                    """() => {
                        const feed = document.querySelector('div[role="feed"]');
                        if (feed) feed.scrollTo(0, feed.scrollHeight);
                    }"""
                )
            except PlaywrightError:
                break

            await self._page.wait_for_timeout(int(self.scroll_pause * 1000))
            if hard_stop.is_stopping():
                break

            try:
                if await self._page.evaluate(_END_OF_LIST_JS):
                    break
                count = await self._page.evaluate(_CARD_COUNT_JS)
            except PlaywrightError:
                break

            if count == previous_count:
                stable_rounds += 1
                if stable_rounds >= 3:
                    break
            else:
                stable_rounds = 0
            previous_count = count

        return previous_count

    # --- public API ---------------------------------------------------------

    async def search(self, query: str, area_hint: str = "") -> list[dict]:
        """Run one Maps search and return every business card it yields."""
        if hard_stop.is_stopping():
            return []

        center = None
        if area_hint:
            from .. import geo

            center = geo.center_for(area_hint, city=self.city_profile.get("key", ""))
        if center is None:
            latitude, longitude = self.city_profile["center"]
            zoom = self.city_profile.get("zoom", config.MAPS_ZOOM)
        else:
            latitude, longitude = center
            zoom = 15  # tight neighbourhood zoom for town-wise accuracy

        url = (
            f"https://www.google.com/maps/search/{quote_plus(query)}/"
            f"@{latitude},{longitude},{zoom}z?hl=en&gl=IN"
        )

        try:
            await self._page.goto(url, wait_until="domcontentloaded", timeout=25_000)
        except (PlaywrightError, PlaywrightTimeout) as exc:
            if hard_stop.is_stopping():
                return []
            self._log(f"    ! navigation failed: {type(exc).__name__}")
            return []

        if hard_stop.is_stopping():
            return []

        await self._dismiss_consent()

        try:
            await self._page.wait_for_selector('div[role="feed"]', timeout=12_000)
        except PlaywrightTimeout:
            # A highly specific query can land directly on a single place page.
            single = await self._single_place_result(query, area_hint)
            return [single] if single else []

        if hard_stop.is_stopping():
            return []

        await self._scroll_feed()

        if hard_stop.is_stopping():
            return []

        try:
            cards = await self._page.evaluate(_COLLECT_CARDS_JS)
        except PlaywrightError:
            return []

        records = []
        for card in cards:
            record = self._card_to_record(card, query, area_hint)
            if record:
                records.append(record)
        return records

    async def _single_place_result(self, query: str, area_hint: str) -> dict | None:
        try:
            await self._page.wait_for_selector("h1", timeout=8000)
            data = await self._page.evaluate(_COLLECT_PLACE_JS)
        except (PlaywrightError, PlaywrightTimeout):
            return None

        name = utils.clean_text(data.get("name"))
        if not name or name.lower() == "results":
            return None

        phone = utils.normalize_phone(data.get("phone"))
        website = utils.canonical_url(data.get("website") or "")
        address = utils.clean_text(data.get("address"))
        return {
            "name": name,
            "website": website if utils.is_company_website(website) else "",
            "address": address,
            "area": area_hint or utils.infer_area(address),
            "category": utils.clean_text(data.get("category")) or query,
            "phones": [phone] if phone else [],
            "emails": [],
            "rating": None,
            "review_count": None,
            "maps_url": self._page.url,
            "source": "gmaps",
        }

    async def fill_place_details(self, maps_url: str) -> dict | None:
        """Open a place page for the exact phone/website a card didn't show."""
        try:
            await self._page.goto(maps_url, wait_until="domcontentloaded", timeout=40_000)
            await self._page.wait_for_selector("h1", timeout=12_000)
            data = await self._page.evaluate(_COLLECT_PLACE_JS)
        except (PlaywrightError, PlaywrightTimeout):
            return None

        website = utils.canonical_url(data.get("website") or "")
        phone = utils.normalize_phone(data.get("phone"))
        return {
            "name": utils.clean_text(data.get("name")),
            "website": website if utils.is_company_website(website) else "",
            "address": utils.clean_text(data.get("address")),
            "category": utils.clean_text(data.get("category")),
            "phones": [phone] if phone else [],
        }

    # --- parsing ------------------------------------------------------------

    @staticmethod
    def _card_to_record(card: dict, query: str, area_hint: str) -> dict | None:
        text = card.get("text") or ""
        lines = [utils.clean_text(line) for line in text.split("\n")]
        lines = [line for line in lines if line]

        name = utils.clean_text(card.get("name")) or (lines[0] if lines else "")
        if not name or name.lower() in ("results", "sponsored"):
            return None

        rating, review_count = _parse_rating(card.get("rating_label", ""), lines)
        category, address = _parse_category_and_address(lines, name)

        website = utils.canonical_url(card.get("website") or "")
        if website and not utils.is_company_website(website):
            website = ""

        phones = utils.extract_phones(text)

        return {
            "name": name,
            "website": website,
            "address": address,
            "area": area_hint or utils.infer_area(address),
            "category": category or query,
            "rating": rating,
            "review_count": review_count,
            "phones": phones,
            "emails": [],
            "maps_url": card.get("maps_url", ""),
            "source": "gmaps",
        }


def _parse_rating(rating_label: str, lines: list[str]) -> tuple[float | None, int | None]:
    """Read '4.8 stars 120 Reviews' or the inline '4.8(120)' card line."""
    rating: float | None = None
    reviews: int | None = None

    if rating_label:
        match = _RATING_RE.search(rating_label)
        if match:
            try:
                value = float(match.group(1).replace(",", "."))
                if 0 < value <= 5:
                    rating = value
                    if match.group(2):
                        reviews = int(match.group(2).replace(",", ""))
            except (ValueError, TypeError):
                pass

    # The aria-label frequently carries the score without the review count, so
    # the card's own text is still worth scanning for the missing half.
    if rating is None or reviews is None:
        for index, line in enumerate(lines[:8]):
            match = _INLINE_RATING_RE.match(line)
            if match:
                try:
                    rating = (
                        rating if rating is not None else float(match.group(1).replace(",", "."))
                    )
                    reviews = (
                        reviews if reviews is not None else int(match.group(2).replace(",", ""))
                    )
                    break
                except ValueError:
                    continue

            if _BARE_RATING_RE.match(line):
                if rating is None:
                    rating = float(line.replace(",", "."))
                following = lines[index + 1] if index + 1 < len(lines) else ""
                if reviews is None and _REVIEW_COUNT_RE.match(following):
                    try:
                        reviews = int(following.strip("()").replace(",", ""))
                    except ValueError:
                        pass
                break

    return rating, reviews


def _is_rating_segment(segment: str) -> bool:
    return bool(
        _INLINE_RATING_RE.match(segment)
        or _BARE_RATING_RE.match(segment)
        or _REVIEW_COUNT_RE.match(segment)
        or _NO_REVIEWS_RE.match(segment)
    )


def _looks_like_address(segment: str) -> bool:
    if _ADDRESS_HINT_RE.search(segment):
        return True
    if segment[:1].isdigit() and "," in segment:
        return True
    return bool(re.search(r"\b\d{6}\b", segment))  # pin code


def _parse_category_and_address(lines: list[str], name: str) -> tuple[str, str]:
    """
    Split a card's detail lines into a category and a street address.

    Maps packs several fields onto one line separated by middle dots, mixing
    the address in with opening hours and the phone number
    ('Open 24 hours · 083201 11741'), so every line is broken into segments and
    each segment is classified on its own.
    """
    segments: list[str] = []
    for line in lines:
        if line == name:
            continue
        if line.strip().lower() in _CARD_ACTION_WORDS:
            continue
        pieces = [line]
        for dot in _DOT_SEPARATORS:
            pieces = [part for piece in pieces for part in piece.split(dot)]
        segments.extend(piece.strip() for piece in pieces if piece.strip())

    category = ""
    address_parts: list[str] = []

    for segment in segments:
        if _is_rating_segment(segment) or _NOISE_SEGMENT_RE.match(segment):
            continue
        if segment.lower() in _CARD_ACTION_WORDS:
            continue
        if utils.normalize_phone(segment):  # the phone lives in its own column
            continue
        if not category and len(segment) <= 60 and not _looks_like_address(segment):
            category = segment
            continue
        address_parts.append(segment)

    address = ", ".join(dict.fromkeys(address_parts))[:300]
    return category, address

"""
Google Maps discovery via Playwright.

Maps is the only one of the three sources that reliably hands over a company's
name, phone and website together. It caps each search at roughly 120 results,
so breadth comes from running many category x locality queries rather than
paginating a single one.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any
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

    // Find the full card container element
    let card = anchor.closest('.Nv2PK') || anchor.closest('[role="article"]') || anchor.parentElement;
    for (let i = 0; i < 5 && card && (card.innerText || '').trim().length < 5; i++) {
      card = card.parentElement;
    }
    if (!card) continue;

    let website = '';
    const siteLink = card.querySelector('a[data-value="Website"]')
      || card.querySelector('a[aria-label*="Website" i]')
      || card.querySelector('a[aria-label^="Visit" i]')
      || card.querySelector('a[data-tooltip*="Website" i]')
      || card.querySelector('a[data-item-id="authority"]');
    if (siteLink) website = siteLink.href || '';

    let phone = '';
    const phoneEl = card.querySelector('button[data-tooltip*="Phone" i]')
      || card.querySelector('button[aria-label*="Phone" i]')
      || card.querySelector('a[data-value="Call"]')
      || card.querySelector('a[href^="tel:"]')
      || card.querySelector('button[data-item-id^="phone:"]');
    if (phoneEl) {
      phone = (phoneEl.getAttribute('data-item-id') || '').replace('phone:tel:', '')
        || (phoneEl.getAttribute('aria-label') || '').replace(/^Phone:\\s*/i, '')
        || (phoneEl.getAttribute('href') || '').replace(/^tel:/i, '')
        || phoneEl.textContent || '';
    }

    let ratingLabel = '';
    const ratingEl = card.querySelector('span[role="img"][aria-label]');
    if (ratingEl) ratingLabel = ratingEl.getAttribute('aria-label') || '';

    out.push({
      name: anchor.getAttribute('aria-label') || '',
      maps_url: href,
      website: website,
      phone: phone,
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

  const phoneButton = document.querySelector('button[data-item-id^="phone:tel:"]')
    || document.querySelector('button[aria-label^="Phone:"]')
    || document.querySelector('button[data-tooltip*="phone" i]')
    || document.querySelector('a[data-item-id^="phone:tel:"]')
    || document.querySelector('a[href^="tel:"]');
  let phone = '';
  if (phoneButton) {
    phone = (phoneButton.getAttribute('data-item-id') || '').replace('phone:tel:', '')
      || (phoneButton.getAttribute('aria-label') || '').replace(/^Phone:\\s*/i, '')
      || (phoneButton.getAttribute('href') || '').replace(/^tel:/i, '')
      || (phoneButton.textContent || '');
  }

  const websiteLink = document.querySelector('a[data-item-id="authority"]')
    || document.querySelector('a[aria-label*="website" i]')
    || document.querySelector('a[data-tooltip*="website" i]');

  const addressButton = document.querySelector('button[data-item-id="address"]')
    || document.querySelector('button[aria-label^="Address:"]')
    || document.querySelector('[data-item-id="oloc"]');

  return {
    name: pick('h1'),
    website: websiteLink ? (websiteLink.getAttribute('href') || '') : '',
    phone: phone,
    address: addressButton ? (addressButton.getAttribute('aria-label') || addressButton.textContent || '').replace(/^Address:\\s*/i, '') : '',
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
    r"(?i)\b("
    r"road|rd|marg|street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|way|court|ct|"
    r"square|sq|terrace|ter|suite|ste|apt|unit|floor|fl|flr|building|bldg|highway|hwy|parkway|pkwy|"
    r"opp|opposite|near|nr|nagar|society|soc|complex|plaza|hub|tower|chowk|circle|char rasta|"
    r"gam|park|point|arcade|mall|block|sector|gidc|cross|char|residency|apartment|estate|market|char-rasta|no\."
    r")\b"
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
        self._rpc_places_by_fid: dict[str, dict[str, Any]] = {}
        self._rpc_places_by_name: dict[str, dict[str, Any]] = {}

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
        self._page.on("response", self._handle_network_response)
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

    async def _handle_network_response(self, response: Any) -> None:
        url = response.url
        if "search?tbm=map" in url:
            try:
                text = await response.text()
                clean = re.sub(r"^\)\]\}'\s*", "", text)
                data = json.loads(clean)
                places = self._parse_rpc_places(data)
                for p in places:
                    fid = p.get("feature_id")
                    if fid:
                        self._rpc_places_by_fid[fid] = p
                    name = p.get("name")
                    if name:
                        self._rpc_places_by_name[name.lower().strip()] = p
            except Exception:
                pass

    @staticmethod
    def _parse_rpc_places(json_data: Any) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []

        def search_lists(obj: Any) -> None:
            if isinstance(obj, list):
                if len(obj) > 20 and len(obj) > 11:
                    fid = obj[10] if len(obj) > 10 and isinstance(obj[10], str) and "0x" in obj[10] and ":" in obj[10] else None
                    title = obj[11] if len(obj) > 11 and isinstance(obj[11], str) else None
                    if fid and title:
                        address = ""
                        if len(obj) > 39 and isinstance(obj[39], str):
                            address = obj[39]
                        elif len(obj) > 18 and isinstance(obj[18], str):
                            address = obj[18]
                        elif len(obj) > 2 and isinstance(obj[2], list):
                            address = ", ".join(str(x) for x in obj[2] if isinstance(x, str))

                        area = ""
                        if len(obj) > 14 and isinstance(obj[14], str):
                            area = obj[14]

                        categories = []
                        if len(obj) > 13 and isinstance(obj[13], list):
                            categories = [str(c) for c in obj[13] if isinstance(c, str)]
                        category = categories[0] if categories else ""

                        website = ""
                        instagram = ""
                        facebook = ""
                        linkedin = ""
                        if len(obj) > 7 and isinstance(obj[7], list) and obj[7] and isinstance(obj[7][0], str):
                            raw_w = obj[7][0].strip()
                            if "instagram.com" in raw_w.lower():
                                instagram = raw_w
                            elif "facebook.com" in raw_w.lower():
                                facebook = raw_w
                            elif "linkedin.com" in raw_w.lower():
                                linkedin = raw_w
                            elif utils.is_company_website(raw_w):
                                website = utils.canonical_url(raw_w)

                        phones: list[str] = []
                        for idx in (178, 179, 180, 181, 182):
                            if len(obj) > idx and isinstance(obj[idx], list):
                                for sub in obj[idx]:
                                    if isinstance(sub, list) and sub and isinstance(sub[0], str):
                                        p_norm = utils.normalize_phone(sub[0].strip())
                                        if p_norm and p_norm not in phones:
                                            phones.append(p_norm)
                                    elif isinstance(sub, str):
                                        p_norm = utils.normalize_phone(sub.strip())
                                        if p_norm and p_norm not in phones:
                                            phones.append(p_norm)

                        rating: float | None = None
                        reviews: int | None = None
                        if len(obj) > 4 and isinstance(obj[4], list):
                            for r_val in obj[4]:
                                if isinstance(r_val, (int, float)) and 1.0 <= float(r_val) <= 5.0:
                                    rating = float(r_val)
                                    break
                            if len(obj[4]) > 8 and isinstance(obj[4][8], int):
                                reviews = obj[4][8]

                        results.append({
                            "name": title,
                            "feature_id": fid,
                            "address": address,
                            "area": area,
                            "category": category,
                            "website": website,
                            "instagram": instagram,
                            "facebook": facebook,
                            "linkedin": linkedin,
                            "phones": phones,
                            "rating": rating,
                            "reviews": reviews,
                        })
                        return
                for sub in obj:
                    search_lists(sub)

        search_lists(json_data)
        return results

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
                # Nudge scroll slightly up then back down to force lazy-load trigger
                try:
                    await self._page.evaluate(
                        """() => {
                            const feed = document.querySelector('div[role="feed"]');
                            if (feed) {
                                feed.scrollBy(0, -250);
                                setTimeout(() => feed.scrollTo(0, feed.scrollHeight), 80);
                            }
                        }"""
                    )
                except Exception:
                    pass
                if stable_rounds >= 5:
                    break
            else:
                stable_rounds = 0
            previous_count = count

        return previous_count

    # --- public API ---------------------------------------------------------

    async def search(
        self,
        query: str,
        area_hint: str = "",
        fill_missing_details: bool = True,
        max_fill_details: int = 10,
    ) -> list[dict]:
        """Run one Maps search and return every business card it yields."""
        if hard_stop.is_stopping():
            return []

        self._rpc_places_by_fid.clear()
        self._rpc_places_by_name.clear()

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

        cc = self.city_profile.get("country_code", "+1")
        gl_map = {
            "+1": "US",
            "+44": "GB",
            "+61": "AU",
            "+91": "IN",
            "+33": "FR",
            "+49": "DE",
            "+81": "JP",
            "+65": "SG",
            "+971": "AE",
        }
        if cc == "+1" and any(k in self.city_profile.get("key", "") for k in ("toronto", "canada", "ontario", "vancouver")):
            gl = "CA"
        else:
            gl = gl_map.get(cc, "US")

        url = (
            f"https://www.google.com/maps/search/{quote_plus(query)}/"
            f"@{latitude},{longitude},{zoom}z?hl=en&gl={gl}"
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
        seen_fids: set[str] = set()
        seen_names: set[str] = set()
        for card in cards:
            record = self._card_to_record(card, query, area_hint)
            if record:
                fid = utils.maps_feature_id(record.get("maps_url", ""))
                name_k = record["name"].lower().strip()
                if fid:
                    seen_fids.add(fid)
                if name_k:
                    seen_names.add(name_k)
                records.append(record)

        # Include any high-fidelity RPC places captured from the stream that weren't caught in the DOM feed
        city_k = self.city_profile.get("key", "") if hasattr(self, "city_profile") else ""
        for fid, r_place in self._rpc_places_by_fid.items():
            name_k = (r_place.get("name") or "").lower().strip()
            if fid not in seen_fids and name_k not in seen_names and r_place.get("name"):
                m_url = f"https://www.google.com/maps/place/data=!4m2!3m1!1s{fid}"
                addr = r_place.get("address") or ""
                rec = {
                    "name": r_place["name"],
                    "website": r_place.get("website") or "",
                    "address": addr,
                    "area": area_hint or r_place.get("area") or utils.infer_area(addr, city=city_k),
                    "category": r_place.get("category") or query,
                    "rating": r_place.get("rating"),
                    "review_count": r_place.get("reviews"),
                    "phones": list(r_place.get("phones") or []),
                    "emails": [],
                    "instagram": r_place.get("instagram") or "",
                    "facebook": r_place.get("facebook") or "",
                    "linkedin": r_place.get("linkedin") or "",
                    "maps_url": m_url,
                    "source": "gmaps",
                }
                records.append(rec)
                seen_fids.add(fid)
                seen_names.add(name_k)

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
        city_k = self.city_profile.get("key", "") if hasattr(self, "city_profile") else ""
        return {
            "name": name,
            "website": website if utils.is_company_website(website) else "",
            "address": address,
            "area": area_hint or utils.infer_area(address, city=city_k),
            "category": utils.clean_text(data.get("category")) or query,
            "phones": [phone] if phone else [],
            "emails": [],
            "rating": None,
            "review_count": None,
            "maps_url": self._page.url,
            "source": "gmaps",
        }

    async def fill_place_details(self, maps_url: str) -> dict | None:
        """Open a place page in a lightweight tab for exact phone/website/address if needed."""
        if not maps_url or not self._context:
            return None
        page = None
        try:
            page = await self._context.new_page()
            await page.goto(maps_url, wait_until="domcontentloaded", timeout=12_000)
            await page.wait_for_selector("h1", timeout=5_000)
            data = await page.evaluate(_COLLECT_PLACE_JS)
        except (PlaywrightError, PlaywrightTimeout):
            return None
        finally:
            if page:
                try:
                    await page.close()
                except Exception:
                    pass

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

    def _card_to_record(self, card: dict, query: str, area_hint: str) -> dict | None:
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

        # Phone extraction: prefer explicit card button/link first
        card_phone = utils.normalize_phone(card.get("phone") or "")
        phones = [card_phone] if card_phone else []

        # If not present on button, scan filtered text (excluding rating, noise, review quotes)
        if not phones:
            scan_lines = [
                line for line in lines
                if line != name and not _is_rating_segment(line) and not _NOISE_SEGMENT_RE.match(line) and not _is_review_quote(line)
            ]
            for p in utils.extract_phones("\n".join(scan_lines)):
                p_digits = re.sub(r"\D", "", p)
                if review_count and p_digits.endswith(str(review_count)):
                    continue
                if p not in phones:
                    phones.append(p)

        maps_url = card.get("maps_url", "")
        fid = utils.maps_feature_id(maps_url)

        # Merge with high-fidelity RPC intercepted data
        rpc_place = None
        if hasattr(self, "_rpc_places_by_fid"):
            rpc_place = (self._rpc_places_by_fid.get(fid) if fid else None) or self._rpc_places_by_name.get(name.lower().strip())

        instagram = ""
        facebook = ""
        linkedin = ""
        if rpc_place:
            if not phones and rpc_place.get("phones"):
                phones = list(rpc_place["phones"])
            elif rpc_place.get("phones"):
                for p in rpc_place["phones"]:
                    if p not in phones:
                        phones.append(p)
            if not website and rpc_place.get("website"):
                website = rpc_place["website"]
            if rpc_place.get("address") and (not address or len(rpc_place["address"]) > len(address) or '"' in address):
                address = rpc_place["address"]
            if not category and rpc_place.get("category"):
                category = rpc_place["category"]
            if rating is None and rpc_place.get("rating") is not None:
                rating = rpc_place["rating"]
            if review_count is None and rpc_place.get("reviews") is not None:
                review_count = rpc_place["reviews"]
            instagram = rpc_place.get("instagram") or ""
            facebook = rpc_place.get("facebook") or ""
            linkedin = rpc_place.get("linkedin") or ""

        city_k = self.city_profile.get("key", "") if hasattr(self, "city_profile") else ""
        area = area_hint or (rpc_place.get("area") if rpc_place else "") or utils.infer_area(address, city=city_k)

        return {
            "name": name,
            "website": website,
            "address": address,
            "area": area,
            "category": category or query,
            "rating": rating,
            "review_count": review_count,
            "phones": phones,
            "emails": [],
            "instagram": instagram,
            "facebook": facebook,
            "linkedin": linkedin,
            "maps_url": maps_url,
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


_POSTCODE_RE = re.compile(
    r"(?i)\b(?:"
    r"\d{5}(?:-\d{4})?|"  # US ZIP
    r"\d{6}|"             # Indian PIN
    r"[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|"  # UK Postcode
    r"[A-Z]\d[A-Z]\s*\d[A-Z]\d|"            # Canadian Postal Code
    r"\d{4}"              # Australian Postcode
    r")\b"
)


def _looks_like_address(segment: str) -> bool:
    if _ADDRESS_HINT_RE.search(segment):
        return True
    if segment[:1].isdigit() and ("," in segment or " " in segment):
        parts = segment.split()
        if parts and parts[0].isdigit() and len(segment) > len(parts[0]) + 2:
            return True
    return bool(_POSTCODE_RE.search(segment))


def _is_review_quote(segment: str) -> bool:
    s = segment.strip()
    if not s:
        return False
    if s.startswith(('"', "'", "“", "”", "„")) or s.endswith(('"', "'", "“", "”")):
        return True
    if '""' in s or s.count('"') >= 2 or s.count("“") >= 1:
        return True
    return False


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
        if _is_rating_segment(segment) or _NOISE_SEGMENT_RE.match(segment) or _is_review_quote(segment):
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

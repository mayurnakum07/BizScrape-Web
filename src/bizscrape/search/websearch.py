"""
Website discovery for companies that Maps listed without a site.

A company with no website has no findable email, so this stage is what converts
dead rows into enrichable ones. DuckDuckGo and Bing are used by default because
they answer bulk automated queries; Google is available as an opt-in engine but
starts serving CAPTCHAs after a few dozen requests, which is why it is not the
default despite being the better index.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import re
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from .. import config, utils

_GENERIC_TOKENS = {
    "the",
    "and",
    "pvt",
    "private",
    "ltd",
    "limited",
    "llp",
    "inc",
    "corp",
    "company",
    "co",
    "newyork",
    "usa",
    "ny",
    "best",
    "top",
    "rated",
    "services",
    "service",
    "solutions",
    "solution",
    "group",
    "enterprise",
    "enterprises",
    "technologies",
    "technology",
    "consultancy",
    "consultants",
}


class WebSearcher:
    """Resolves company names to their official website URL."""

    def __init__(
        self, engine: str = "bing", delay: float = config.SEARCH_DELAY, verbose: bool = True
    ):
        self.engine = engine
        self.delay = delay
        self.verbose = verbose
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> WebSearcher:
        self._client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(20.0, connect=10.0),
            headers={
                "User-Agent": utils.random_user_agent(),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-IN,en;q=0.9",
            },
        )
        return self

    async def __aexit__(self, *_exc: object) -> None:
        if self._client:
            await self._client.aclose()

    async def find_website(self, name: str, hint: str = "New York") -> str:
        """
        Return the company's likely official site, or '' when nothing matches.

        Returning nothing is far better than returning a plausible-looking
        wrong domain, so a result is only accepted when the domain or the
        result title genuinely echoes the company name.
        """
        query = f"{name} {hint} official website".strip()
        results = await self._search(query)
        await asyncio.sleep(utils.jitter(self.delay))

        for url, title in results:
            if not utils.is_company_website(url):
                continue
            if _matches_company(name, url, title):
                return utils.canonical_url(url)
        return ""

    async def _search(self, query: str) -> list[tuple[str, str]]:
        try:
            if self.engine == "ddg":
                results = await self._duckduckgo(query)
                # DuckDuckGo often returns HTTP 202 with an empty challenge page
                # to automated clients; fall back to Bing so the stage still works.
                return results or await self._bing(query)
            return await self._bing(query)
        except (httpx.HTTPError, ValueError, OSError, binascii.Error):
            return []

    async def _duckduckgo(self, query: str) -> list[tuple[str, str]]:
        response = await self._client.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code != 200 or "result__a" not in response.text:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        results: list[tuple[str, str]] = []
        for anchor in soup.select("a.result__a")[:12]:
            href = anchor.get("href", "")
            url = _unwrap_ddg(href)
            title = anchor.get_text(" ", strip=True)
            if url:
                results.append((url, title))
        return results

    async def _bing(self, query: str) -> list[tuple[str, str]]:
        response = await self._client.get(
            "https://www.bing.com/search", params={"q": query, "setlang": "en"}
        )
        if response.status_code != 200:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        results: list[tuple[str, str]] = []
        for item in soup.select("li.b_algo")[:12]:
            anchor = item.select_one("h2 a[href]")
            if not anchor:
                continue
            url = _unwrap_bing(anchor["href"])
            if not url:
                cite = item.select_one("cite")
                if cite:
                    cite_text = cite.get_text(" ", strip=True).split()[0]
                    if cite_text.startswith("http"):
                        url = cite_text
                    elif "." in cite_text:
                        url = "https://" + cite_text.strip("/")
            if url:
                results.append((url, anchor.get_text(" ", strip=True)))
        return results


class GoogleSearcher:
    """
    Google-backed website lookup driven through Playwright.

    Google blocks plain HTTP scraping outright and rate-limits even a real
    browser, so this runs slowly and stops itself once a CAPTCHA appears rather
    than hammering a wall.
    """

    def __init__(self, headless: bool = True, delay: float = 6.0, verbose: bool = True):
        self.headless = headless
        self.delay = delay
        self.verbose = verbose
        self.blocked = False
        self._playwright = None
        self._browser = None
        self._page = None

    async def __aenter__(self) -> GoogleSearcher:
        from playwright.async_api import async_playwright

        from ..browser import launch_browser

        self._playwright = await async_playwright().start()
        try:
            self._browser, _used = await launch_browser(
                self._playwright,
                headless=self.headless,
            )
        except RuntimeError:
            await self._playwright.stop()
            self._playwright = None
            raise
        context = await self._browser.new_context(
            user_agent=utils.random_user_agent(),
            locale="en-IN",
            viewport={"width": 1366, "height": 768},
        )
        self._page = await context.new_page()
        return self

    async def __aexit__(self, *_exc: object) -> None:
        try:
            if self._browser:
                await self._browser.close()
        except Exception:
            pass
        finally:
            if self._playwright:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass

    async def find_website(self, name: str, hint: str = "New York") -> str:
        if self.blocked:
            return ""

        query = quote_plus(f"{name} {hint} official website")
        try:
            await self._page.goto(
                f"https://www.google.com/search?q={query}&hl=en&gl=IN&num=10",
                wait_until="domcontentloaded",
                timeout=30_000,
            )
        except Exception:
            return ""

        body = (await self._page.content()).lower()
        if "our systems have detected unusual traffic" in body or "/sorry/index" in self._page.url:
            self.blocked = True
            if self.verbose:
                print("  ! Google served a CAPTCHA - stopping the Google engine", flush=True)
            return ""

        try:
            results = await self._page.evaluate(
                """() => Array.from(document.querySelectorAll('a[href^="http"] h3'))
                        .slice(0, 10)
                        .map(h3 => ({ url: h3.closest('a').href, title: h3.innerText }))"""
            )
        except Exception:
            results = []

        await asyncio.sleep(utils.jitter(self.delay))

        for item in results:
            url, title = item.get("url", ""), item.get("title", "")
            if utils.is_company_website(url) and _matches_company(name, url, title):
                return utils.canonical_url(url)
        return ""


def _unwrap_ddg(href: str) -> str:
    """DuckDuckGo wraps outbound links as /l/?uddg=<encoded target>."""
    if not href:
        return ""
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    if "duckduckgo.com" in parsed.netloc and parsed.path.startswith("/l/"):
        target = parse_qs(parsed.query).get("uddg", [""])[0]
        return unquote(target)
    return href


def _unwrap_bing(href: str) -> str:
    """Bing wraps outbound links as /ck/a?...&u=a1<base64url>."""
    if not href:
        return ""
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    if "bing.com" not in parsed.netloc:
        return href

    encoded = parse_qs(parsed.query).get("u", [""])[0]
    if not encoded:
        return href
    if encoded.startswith("a1"):
        encoded = encoded[2:]
    padded = encoded + "=" * (-len(encoded) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded).decode("utf-8", "replace")
    except (binascii.Error, ValueError):
        return href
    return decoded if decoded.startswith("http") else href


def _name_tokens(name: str) -> list[str]:
    slug = utils.slugify_name(name)
    return [token for token in slug.split() if len(token) >= 4 and token not in _GENERIC_TOKENS]


def _domain_matches(tokens: list[str], flattened: str) -> bool:
    """True when the domain label is clearly built from the company name."""
    if not flattened or not tokens:
        return False

    # "bitrixinfotech" inside bitrixinfotech.com
    joined = "".join(tokens)
    if len(joined) >= 6 and joined in flattened:
        return True

    # Every distinctive token appears (Bitrix + Infotech).
    if len(tokens) >= 2 and all(token in flattened for token in tokens):
        return True

    # Single brand token may only win when it is essentially the whole label
    # (rejects bitrix -> bitrix24, tryon -> tryonfashions). Multi-token names
    # need a stronger signal above, otherwise "Amreli Tech" would claim amreli.org.
    if len(tokens) == 1:
        primary = tokens[0]
        if len(primary) >= 5 and flattened.startswith(primary):
            return (len(primary) / len(flattened)) >= 0.85
    return False


def _matches_company(name: str, url: str, title: str) -> bool:
    """
    Guard against attaching an unrelated domain to a company.

    Accepts when the domain is clearly named after the company, or when the
    search-result title itself contains the company name.
    """
    tokens = _name_tokens(name)
    if not tokens:
        return False

    domain = utils.registrable_domain(url)
    flattened = re.sub(r"[^a-z0-9]", "", domain.split(".")[0])
    if _domain_matches(tokens, flattened):
        return True

    title_slug = re.sub(r"[^a-z0-9]", "", utils.slugify_name(title))
    name_slug = re.sub(r"[^a-z0-9]", "", utils.slugify_name(name))
    if not name_slug or len(name_slug) < 6 or name_slug not in title_slug:
        return False
    # Title match still needs the longest brand token in the domain or title,
    # so "Bitrix24 - Free CRM" cannot claim "Bitrix Infotech".
    primary = max(tokens, key=len)
    return primary in flattened or primary in title_slug

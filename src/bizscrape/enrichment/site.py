"""
Email and phone enrichment by crawling each company's own website.

Neither Google Maps nor directory listings reliably publish email addresses, so this stage is
the only real source for them: fetch the homepage, follow the contact/about
links, and pull out every address and phone number the company publishes.
"""

from __future__ import annotations

import asyncio
import json
import re
import ssl
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from .. import config, utils
from ..retry import async_retry, is_transient
from ..security import async_validate_fetch_url, validate_fetch_url

# "sales [at] acme [dot] com" and friends, a very common spam-avoidance trick.
_OBFUSCATED_EMAIL_RE = re.compile(
    r"(?i)([a-z0-9._%+\-]+)\s*(?:\[\s*at\s*\]|\(\s*at\s*\)|\{\s*at\s*\}|\s+at\s+)\s*"
    r"([a-z0-9.\-]+)\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+)\s*"
    r"([a-z]{2,12})"
)

_SKIP_LINK_RE = re.compile(
    r"(?i)\.(pdf|jpe?g|png|gif|svg|webp|zip|rar|docx?|xlsx?|pptx?|mp4|mp3|exe)(\?|$)"
)

MAX_BYTES = 2_000_000


class SiteEnricher:
    """Crawls a batch of company websites concurrently."""

    def __init__(
        self,
        concurrency: int = config.ENRICH_CONCURRENCY,
        timeout: int = config.SITE_TIMEOUT,
        max_pages: int = config.MAX_PAGES_PER_SITE,
        verbose: bool = True,
    ):
        self.concurrency = concurrency
        self.timeout = timeout
        self.max_pages = max_pages
        self.verbose = verbose

    async def run(self, targets: list[tuple[int, str, str]], on_result) -> dict:
        """
        Enrich (company_id, name, website) tuples, invoking on_result per site.

        Results are handed back one at a time rather than collected, so a run
        that is interrupted keeps everything already written to the database.
        """
        queue: asyncio.Queue = asyncio.Queue()
        for target in targets:
            queue.put_nowait(target)

        counters = {"done": 0, "failed": 0, "emails": 0, "processed": 0}
        total = len(targets)

        # Certificates on small business sites are frequently expired or misconfigured.
        # SSL verification is configurable via BIZSCRAPE_VERIFY_SSL (default False for compatibility).
        verify_ssl = getattr(config, "VERIFY_SSL", False)
        async with httpx.AsyncClient(
            follow_redirects=True,
            max_redirects=config.MAX_REDIRECTS,
            timeout=httpx.Timeout(self.timeout, connect=10.0),
            verify=verify_ssl,
            limits=httpx.Limits(
                max_connections=self.concurrency * 2, max_keepalive_connections=self.concurrency
            ),
            headers={
                "User-Agent": utils.random_user_agent(),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        ) as client:

            async def worker() -> None:
                while True:
                    try:
                        company_id, name, website = queue.get_nowait()
                    except asyncio.QueueEmpty:
                        return
                    try:
                        result = await self._enrich_site(client, website)
                    except Exception as exc:  # one bad site must not kill the run
                        result = {
                            "emails": [],
                            "phones": [],
                            "status": "failed",
                            "note": f"{type(exc).__name__}: {exc}"[:200],
                        }

                    counters["processed"] += 1
                    if result["status"] == "failed":
                        counters["failed"] += 1
                    else:
                        counters["done"] += 1
                    counters["emails"] += len(result["emails"])

                    on_result(company_id, result)

                    if self.verbose:
                        marker = (
                            "+"
                            if result["emails"]
                            else ("x" if result["status"] == "failed" else ".")
                        )
                        found = ", ".join(result["emails"][:2])
                        print(
                            f"  [{counters['processed']}/{total}] {marker} {name[:38]:<38} {found}",
                            flush=True,
                        )
                    queue.task_done()

            workers = [asyncio.create_task(worker()) for _ in range(self.concurrency)]
            await asyncio.gather(*workers)

        return counters

    # --- per-site logic -----------------------------------------------------

    async def _enrich_site(self, client: httpx.AsyncClient, website: str) -> dict:
        base = utils.canonical_url(website)
        if not base:
            return {"emails": [], "phones": [], "status": "failed", "note": "bad url"}

        try:
            await async_validate_fetch_url(base, resolve=True)
        except ValueError as exc:
            return {"emails": [], "phones": [], "status": "failed", "note": f"blocked: {exc}"}

        emails: list[str] = []
        phones: list[str] = []
        socials: dict[str, str] = {}
        site_domain = utils.registrable_domain(base)

        homepage_html, final_url = await self._fetch(client, base)
        if homepage_html is None and base.startswith("https://"):
            homepage_html, final_url = await self._fetch(client, "http://" + base[8:])
        if homepage_html is None:
            return {"emails": [], "phones": [], "status": "failed", "note": "unreachable"}

        root = final_url or base
        self._harvest(homepage_html, root, emails, phones, socials)

        for page_url in self._contact_candidates(homepage_html, root):
            if len(emails) >= 8 or self.max_pages <= 1:
                break
            html, resolved = await self._fetch(client, page_url)
            if html:
                self._harvest(html, resolved or page_url, emails, phones, socials)

        emails.sort(key=lambda address: utils.email_score(address, site_domain), reverse=True)

        return {
            "emails": emails[:12],
            "phones": phones[:8],
            "linkedin": socials.get("linkedin", ""),
            "facebook": socials.get("facebook", ""),
            "instagram": socials.get("instagram", ""),
            "status": "done",
            "note": "",
        }

    async def _fetch(self, client: httpx.AsyncClient, url: str) -> tuple[str | None, str | None]:
        try:
            await async_validate_fetch_url(url, resolve=True)
        except ValueError:
            return None, None

        async def _once() -> httpx.Response:
            return await client.get(url, headers={"User-Agent": utils.random_user_agent()})

        try:
            response = await async_retry(
                _once,
                attempts=config.HTTP_RETRY_ATTEMPTS,
                retry_if=lambda exc: is_transient(exc) and not isinstance(exc, ValueError),
            )
        except (httpx.HTTPError, ssl.SSLError, ValueError, OSError):
            return None, None

        final = str(response.url)
        try:
            await async_validate_fetch_url(final, resolve=True)
        except ValueError:
            return None, None

        if response.status_code >= 400:
            return None, final

        content_type = response.headers.get("content-type", "")
        if content_type and "html" not in content_type and "text" not in content_type:
            return None, final

        content = response.content[:MAX_BYTES]
        try:
            return content.decode(response.encoding or "utf-8", errors="replace"), final
        except (LookupError, TypeError):
            return content.decode("utf-8", errors="replace"), final

    def _contact_candidates(self, html: str, root: str) -> list[str]:
        """
        Pick the pages most likely to carry an email.

        Links discovered in the page's own navigation come first because they
        reflect the real site structure; generic /contact guesses only run when
        discovered links don't exhaust the page budget.
        """
        soup = BeautifulSoup(html, "html.parser")
        seen: list[str] = []
        limit = max(1, self.max_pages - 1)

        for anchor in soup.find_all("a", href=True):
            if len(seen) >= limit:
                break
            href = anchor["href"].strip()
            if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
                continue
            if _SKIP_LINK_RE.search(href):
                continue

            label = (anchor.get_text(" ", strip=True) or "").lower()
            haystack = f"{href.lower()} {label}"
            if not any(hint in haystack for hint in config.CONTACT_LINK_HINTS):
                continue

            absolute = utils.canonical_url(urljoin(root, href))
            if absolute and utils.same_site(absolute, root) and absolute not in seen:
                seen.append(absolute)

        if len(seen) < limit:
            base_root = utils.canonical_url(root)
            for path in config.CONTACT_PATH_GUESSES:
                if len(seen) >= limit:
                    break
                guess = utils.canonical_url(urljoin(base_root + "/", path.lstrip("/")))
                if guess and guess not in seen:
                    seen.append(guess)

        return seen[:limit]

    @staticmethod
    def _harvest(
        html: str, page_url: str, emails: list[str], phones: list[str], socials: dict[str, str]
    ) -> None:
        """Pull every contact signal out of one page into the shared accumulators."""
        soup = BeautifulSoup(html, "html.parser")

        def add_email(candidate: str | None) -> None:
            if candidate and candidate not in emails:
                emails.append(candidate)

        def add_phone(candidate: str | None) -> None:
            if candidate and candidate not in phones:
                phones.append(candidate)

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            if href.lower().startswith("mailto:"):
                add_email(utils.normalize_email(href[7:]))
            elif href.lower().startswith("tel:"):
                add_phone(utils.normalize_phone(href[4:]))
                tel_text = anchor.get_text(" ", strip=True)
                if tel_text:
                    add_phone(utils.normalize_phone(tel_text))
            else:
                network = utils.classify_social(urljoin(page_url, href))
                if network and network not in socials:
                    socials[network] = utils.canonical_url(urljoin(page_url, href))

        # Cloudflare hides addresses behind a hex blob; without decoding these,
        # a large share of Global business sites appear to have no email at all.
        for element in soup.select("[data-cfemail]"):
            add_email(utils.decode_cfemail(element.get("data-cfemail", "")))

        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            for email, phone in _walk_json_ld(script.string or ""):
                if email:
                    add_email(utils.normalize_email(email))
                if phone:
                    add_phone(utils.normalize_phone(phone))

        text = soup.get_text(" ", strip=True)
        for email in utils.extract_emails(text):
            add_email(email)
        for match in _OBFUSCATED_EMAIL_RE.finditer(text):
            add_email(utils.normalize_email(f"{match.group(1)}@{match.group(2)}.{match.group(3)}"))
        for phone in utils.extract_phones(text):
            add_phone(phone)

        # Addresses often live only in inline JS config or meta tags.
        for email in utils.extract_emails(html):
            add_email(email)


def _walk_json_ld(raw: str):
    """Yield (email, phone) pairs found anywhere inside a JSON-LD block."""
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return

    stack = [data]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            for key, value in node.items():
                lowered = key.lower()
                if lowered == "email" and isinstance(value, str):
                    yield value, None
                elif lowered in ("telephone", "phone") and isinstance(value, str):
                    yield None, value
                elif isinstance(value, (dict, list)):
                    stack.append(value)
        elif isinstance(node, list):
            stack.extend(node)

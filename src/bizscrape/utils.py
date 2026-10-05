"""Text, phone, email and URL helpers shared by every stage of the pipeline."""

from __future__ import annotations

import random
import re
import unicodedata
from urllib.parse import urlparse, urlunparse

from . import config

# --- text --------------------------------------------------------------------

_WHITESPACE_RE = re.compile(r"\s+")

# Google Maps renders its UI icons with a private-use-area font, so the scraped
# text is littered with glyphs that crash cp1252 consoles and corrupt CSV cells.
_PRIVATE_USE_RE = re.compile(r"[\ue000-\uf8ff\U000f0000-\U000ffffd]")
_ZERO_WIDTH_RE = re.compile(r"[\u200b-\u200f\u202a-\u202e\ufeff]")


def clean_text(value: object) -> str:
    """Collapse whitespace and strip the invisible characters Maps loves to emit."""
    if not value:
        return ""
    text = str(value)
    text = _PRIVATE_USE_RE.sub(" ", text)
    text = _ZERO_WIDTH_RE.sub("", text)
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\xa0", " ")
    return _WHITESPACE_RE.sub(" ", text).strip()


def slugify_name(name: str) -> str:
    """
    Normalise a company name for duplicate detection.

    Only legal-form suffixes are stripped, so "Acme Tech Pvt. Ltd." and
    "Acme Tech" collapse together while "Radiant Solutions" and
    "Radiant Infotech" stay separate companies.
    """
    text = clean_text(name).lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(
        r"\b(pvt|private|ltd|limited|llp|llc|inc|incorporated|corp|corporation)\b", " ", text
    )
    return _WHITESPACE_RE.sub(" ", text).strip()


_ADDRESS_ABBREVIATIONS = [
    (r"\brd\b", "road"),
    (r"\bstn\b", "station"),
    (r"\bsoc\b", "society"),
    (r"\bngr\b", "nagar"),
    (r"\bopp\b", "opposite"),
    (r"\bnr\b", "near"),
]


def _expand_abbreviations(text: str) -> str:
    text = text.lower()
    for pattern, replacement in _ADDRESS_ABBREVIATIONS:
        text = re.sub(pattern, replacement, text)
    return text


def infer_area(address: str, areas: list[str] | None = None, city: str = "") -> str:
    """
    Recover a locality name from a free-text address.

    City-wide searches carry no locality of their own, so the address is the
    only place the area can come from. Abbreviations are expanded first so
    'Ring Rd' still matches 'Ring Road', and the longest match wins, keeping
    'Manhattan' from being reported as plain 'Varachha'.
    """
    if not address:
        return ""

    if areas is None:
        if city:
            profile = config.resolve_city(city)
            areas = list(profile.get("areas") or [])
        else:
            areas = []
            for profile in config.CITIES.values():
                areas.extend(profile.get("areas") or [])
            areas = list(dict.fromkeys(areas))

    haystack = _expand_abbreviations(address)
    best = ""
    for area in areas:
        token = _expand_abbreviations(area.strip())
        if len(token) >= 3 and len(token) > len(best):
            if re.search(r"\b" + re.escape(token) + r"\b", haystack, re.IGNORECASE):
                best = area
    return best


_MAPS_FEATURE_ID_RE = re.compile(r"(0x[0-9a-f]+:0x[0-9a-f]+)")


def maps_feature_id(maps_url: str) -> str | None:
    """
    Pull Google's own place identifier out of a Maps URL.

    Two searches that surface the same business produce the same feature id,
    making it the most reliable deduplication key available.
    """
    if not maps_url:
        return None
    match = _MAPS_FEATURE_ID_RE.search(maps_url)
    return match.group(1) if match else None


def random_user_agent() -> str:
    return random.choice(config.USER_AGENTS)


def jitter(seconds: float) -> float:
    """Randomise a delay by +/-40% so request timing doesn't look robotic."""
    return max(0.2, seconds * random.uniform(0.6, 1.4))


# --- phones ------------------------------------------------------------------

# Loose scan: any run of 10+ digits with optional separators. Normalisation
# below is what actually decides whether a match is a usable Global number.
# Newlines are deliberately excluded from the separator class, otherwise a
# rating on one line and a pin code on the next get spliced into a fake number.
PHONE_SCAN_RE = re.compile(r"(?<![\w@.])\+?\d[\d \t().\-]{8,18}\d(?![\w@])")

_EXTENSION_RE = re.compile(r"(?i)\b(?:ext|extn|x)\b.*$")

# Country-aware phone normalization context.
# Set by the pipeline at start based on the target city's country code.
_phone_country_code: str = "+1"

_PHONE_RULES: dict[str, dict] = {
    "+1": {"strip_trunk": "1", "lengths": (10,), "starts": "23456789"},
    "+44": {"strip_trunk": "0", "lengths": (10, 11), "starts": ""},
    "+61": {"strip_trunk": "0", "lengths": (9, 10), "starts": ""},
    "+91": {"strip_trunk": "0", "lengths": (10,), "starts": "6789"},
    "+33": {"strip_trunk": "0", "lengths": (9, 10), "starts": ""},
    "+49": {"strip_trunk": "0", "lengths": (9, 10, 11), "starts": ""},
    "+81": {"strip_trunk": "0", "lengths": (9, 10), "starts": ""},
    "+65": {"strip_trunk": "", "lengths": (8,), "starts": "3689"},
    "+971": {"strip_trunk": "0", "lengths": (9,), "starts": "456789"},
}


def set_phone_country(country_code: str) -> None:
    """Set the country code used by normalize_phone (called by pipeline at start)."""
    global _phone_country_code
    if country_code:
        if not country_code.startswith("+"):
            country_code = "+" + country_code
        _phone_country_code = country_code


def normalize_phone(raw: object, country_code: str | None = None) -> str | None:
    """
    Normalize a phone number using the active country context or explicit prefix.

    Returns None when the digits cannot form a valid phone number for the
    active country, filtering out pin codes, years, and ID numbers.
    """
    if not raw:
        return None

    raw_str = clean_text(str(raw))
    text = _EXTENSION_RE.sub("", raw_str)
    digits = re.sub(r"\D", "", text)
    if not digits:
        return None

    # Obvious garbage / repetitive digits
    if len(set(digits)) <= 2:
        return None
    if digits in {"1234567890", "9876543210", "1234512345", "0123456789"}:
        return None

    # Detect international country code directly from number prefix if present
    detected_cc = None
    if raw_str.startswith("+"):
        for cc in sorted(_PHONE_RULES.keys(), key=len, reverse=True):
            if digits.startswith(cc.lstrip("+")):
                detected_cc = cc
                break
    elif raw_str.startswith("00"):
        for cc in sorted(_PHONE_RULES.keys(), key=len, reverse=True):
            if digits.startswith("00" + cc.lstrip("+")):
                detected_cc = cc
                break

    country = detected_cc or country_code or _phone_country_code
    if not country.startswith("+"):
        country = "+" + country
    rules = _PHONE_RULES.get(country, _PHONE_RULES["+1"])
    cc_digits = country.lstrip("+")

    # Strip international dialing prefix: 00CC or just CC
    if digits.startswith("00" + cc_digits):
        digits = digits[2 + len(cc_digits):]
    elif digits.startswith(cc_digits) and len(digits) >= min(rules["lengths"]) + len(cc_digits):
        remaining = digits[len(cc_digits):]
        if len(remaining) in rules["lengths"] or (rules.get("strip_trunk") and remaining.startswith(rules["strip_trunk"])):
            digits = remaining

    # Strip extraneous leading zeros if number is longer than valid length (e.g. "01987..." -> "1987...")
    while digits.startswith("0") and len(digits) > max(rules["lengths"]):
        digits = digits[1:]

    # Strip trunk prefix (0 for UK/AU/IN, 1 for US long-distance)
    trunk = rules.get("strip_trunk", "")
    if trunk and digits.startswith(trunk):
        stripped = digits[len(trunk):]
        if len(stripped) in rules["lengths"]:
            digits = stripped
        elif len(digits) > max(rules["lengths"]):
            digits = stripped

    # Strip remaining leading zeros only if number is still longer than required
    while digits.startswith("0") and len(digits) > min(rules["lengths"]):
        digits = digits[1:]

    # Validate national number length
    if len(digits) not in rules["lengths"]:
        return None

    # Validate starting digit when the country has restrictions
    valid_starts = rules.get("starts", "")
    if valid_starts and digits[0] not in valid_starts:
        return None

    return country + digits


def extract_phones(text: str, country_code: str | None = None) -> list[str]:
    """Pull every distinct valid phone number out of a blob of text."""
    if not text:
        return []
    found: list[str] = []
    for match in PHONE_SCAN_RE.finditer(text):
        candidate = match.group(0).strip()
        # Fast pre-check: require at least 8 digits in the raw match to avoid zip codes/years
        if sum(c.isdigit() for c in candidate) < 8:
            continue
        number = normalize_phone(candidate, country_code=country_code)
        if number and number not in found:
            found.append(number)
    return found


def pretty_phone(number: str) -> str:
    """Format a phone number for human-friendly display."""
    if not number.startswith("+"):
        return number
    for cc in ("+1", "+44", "+61", "+91"):
        if number.startswith(cc):
            national = number[len(cc):]
            if cc == "+1" and len(national) == 10:
                return f"+1 ({national[:3]}) {national[3:6]}-{national[6:]}"
            return f"{cc} {national}"
    return number


# --- emails ------------------------------------------------------------------

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}")

_HEX_LOCALPART_RE = re.compile(r"^[0-9a-f]{16,}$")


def is_real_email(email: str) -> bool:
    """Reject the placeholders, asset filenames and tracking addresses."""
    email = email.strip().strip(".,;:'\"()<>[]").lower()
    if email.count("@") != 1:
        return False

    local, _, domain = email.partition("@")
    if not local or not domain or "." not in domain:
        return False
    if len(email) > 100 or len(local) > 64:
        return False

    tld = domain.rsplit(".", 1)[-1]
    if tld in config.EMAIL_FAKE_TLDS:
        return False
    if domain in config.EMAIL_DOMAIN_BLOCKLIST:
        return False
    if any(domain.endswith("." + blocked) for blocked in config.EMAIL_DOMAIN_BLOCKLIST):
        return False
    if local in config.EMAIL_LOCALPART_BLOCKLIST:
        return False
    if _HEX_LOCALPART_RE.match(local):  # build hashes, Sentry keys
        return False
    if local.startswith(("u003", "x2f", "2f")):
        return False
    if ".." in email or email.startswith(".") or "@." in email:
        return False
    return True


def normalize_email(email: str) -> str | None:
    email = clean_text(email).strip().strip(".,;:'\"()<>[]").lower()
    email = email.replace("mailto:", "").split("?")[0].strip()
    if not EMAIL_RE.fullmatch(email):
        match = EMAIL_RE.search(email)
        if not match:
            return None
        email = match.group(0).lower()
    return email if is_real_email(email) else None


def extract_emails(text: str) -> list[str]:
    """Find every plausible real email address in a blob of text or HTML."""
    if not text:
        return []
    found: list[str] = []
    for match in EMAIL_RE.finditer(text):
        email = normalize_email(match.group(0))
        if email and email not in found:
            found.append(email)
    return found


def decode_cfemail(hex_string: str) -> str | None:
    """
    Undo Cloudflare's email obfuscation.

    Cloudflare replaces addresses with <a data-cfemail="hex">; the first byte is
    an XOR key applied to the rest. Skipping this loses emails on a large share
    of Global business sites, which sit behind Cloudflare by default.
    """
    try:
        data = bytes.fromhex(hex_string.strip())
    except (ValueError, AttributeError):
        return None
    if len(data) < 2:
        return None
    key = data[0]
    decoded = "".join(chr(byte ^ key) for byte in data[1:])
    return normalize_email(decoded)


def email_score(email: str, site_domain: str = "") -> int:
    """
    Rank addresses so the most contactable one lands in `email_primary`.
    Role inboxes on the company's own domain beat a personal Gmail.
    """
    local, _, domain = email.partition("@")
    score = 0

    if site_domain and (domain == site_domain or domain.endswith("." + site_domain)):
        score += 40
    elif domain in {
        "gmail.com",
        "yahoo.com",
        "yahoo.in",
        "hotmail.com",
        "outlook.com",
        "rediffmail.com",
    }:
        score += 5
    else:
        score += 15

    priority = [
        ("info", 30),
        ("contact", 30),
        ("enquiry", 28),
        ("enquiries", 28),
        ("inquiry", 28),
        ("sales", 26),
        ("business", 24),
        ("hello", 24),
        ("mail", 20),
        ("office", 20),
        ("admin", 16),
        ("support", 14),
        ("hr", 12),
        ("careers", 10),
        ("career", 10),
        ("jobs", 10),
    ]
    for keyword, points in priority:
        if local.startswith(keyword):
            score += points
            break

    if local.startswith(
        ("noreply", "no-reply", "donotreply", "postmaster", "abuse", "webmaster", "privacy")
    ):
        score -= 40
    return score


def pick_primary_email(emails: list[str], website: str = "") -> str:
    if not emails:
        return ""
    domain = registrable_domain(website) if website else ""
    return max(emails, key=lambda email: email_score(email, domain))


# --- urls --------------------------------------------------------------------

_TRACKING_PARAM_RE = re.compile(r"(?i)^(utm_|fbclid|gclid|mc_|ref|source$)")

SOCIAL_HOSTS = {
    "linkedin": ("linkedin.com",),
    "facebook": ("facebook.com", "fb.com"),
    "instagram": ("instagram.com",),
    "twitter": ("twitter.com", "x.com"),
    "youtube": ("youtube.com", "youtu.be"),
}

# Hosts that show up as "websites" but are never a company's own site.
NON_WEBSITE_HOSTS = (
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "wa.me",
    "whatsapp.com",
    "justdial.com",
    "yelp.com",
    "google.com",
    "maps.google.com",
    "sulekha.com",
    "yellowpages.com",
    "yellowpages.in",
    "business.site",
    "t.me",
    "play.google.com",
    "apps.apple.com",
    "blogspot.com",
    "wordpress.com",
    "medium.com",
    "wikipedia.org",
    "nic.in",
    "gov.in",
    "bing.com",
    "duckduckgo.com",
    "business.google.com",
    "maps.app.goo.gl",
    "goo.gl",
    "g.co",
    "g.page",
    "google.co.in",
    "google.co.uk",
    "google.ca",
    "google.com.au",
    "support.google.com",
    "sites.google.com",
    "bit.ly",
    "tinyurl.com",
    "indiamart.com",
    "tradeindia.com",
    "magicbricks.com",
    "housing.com",
    "99acres.com",
    "tripadvisor.com",
    "tripadvisor.in",
    "zomato.com",
    "swiggy.com",
    "practo.com",
    "jdmagicbox.com",
    "bark.com",
    "trustpilot.com",
    "quikr.com",
    "olx.in",
    "olx.com",
    "mapsofindia.com",
)


def registrable_domain(url: str) -> str:
    """Host without www/protocol, e.g. https://www.Foo.co.in/x -> foo.co.in."""
    if not url:
        return ""
    if "://" not in url:
        url = "http://" + url
    try:
        host = urlparse(url).netloc.lower()
    except ValueError:
        return ""
    host = host.split("@")[-1].split(":")[0]
    return host[4:] if host.startswith("www.") else host


def canonical_url(url: str) -> str:
    """Normalise a site URL: force scheme, drop tracking params and fragments."""
    if not url:
        return ""
    url = clean_text(url)
    if url.startswith("//"):
        url = "https:" + url
    if "://" not in url:
        url = "https://" + url
    try:
        parts = urlparse(url)
    except ValueError:
        return ""
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return ""

    query = "&".join(
        piece
        for piece in parts.query.split("&")
        if piece and not _TRACKING_PARAM_RE.match(piece.split("=")[0])
    )
    path = parts.path.rstrip("/") if parts.path != "/" else ""
    return urlunparse((parts.scheme, parts.netloc, path, "", query, ""))


def is_company_website(url: str) -> bool:
    """True when a URL looks like a company's own site rather than a profile or map redirect."""
    if not url:
        return False
    domain = registrable_domain(url)
    if not domain or "." not in domain:
        return False
    if any(domain == host or domain.endswith("." + host) for host in NON_WEBSITE_HOSTS):
        return False
    try:
        parsed = urlparse(url if "://" in url else "https://" + url)
        path = (parsed.path or "").lower()
        if "google." in domain and ("/maps" in path or "/search" in path or "/url" in path):
            return False
    except ValueError:
        return False
    return True


def classify_social(url: str) -> str | None:
    domain = registrable_domain(url)
    for network, hosts in SOCIAL_HOSTS.items():
        if any(domain == host or domain.endswith("." + host) for host in hosts):
            return network
    return None


def same_site(url_a: str, url_b: str) -> bool:
    domain_a, domain_b = registrable_domain(url_a), registrable_domain(url_b)
    if not domain_a or not domain_b:
        return False
    return (
        domain_a == domain_b
        or domain_a.endswith("." + domain_b)
        or domain_b.endswith("." + domain_a)
    )

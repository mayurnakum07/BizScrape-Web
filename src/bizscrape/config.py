"""
Tunable settings for BizScrape.

Static defaults (cities, niches, timeouts, crawl limits) live here.
Per-run user settings (city, niche, target, sources, output, concurrency)
come from the CLI / interactive wizard — you should not need to edit Python
for normal use.
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

# --- cities ------------------------------------------------------------------

CITIES: dict[str, dict[str, Any]] = {
    "surat": {
        "label": "Surat",
        "center": (21.1702, 72.8311),
        "zoom": 12,
        "areas": [
            "Adajan",
            "Vesu",
            "Piplod",
            "Athwa",
            "Athwalines",
            "Ghod Dod Road",
            "City Light",
            "Pal",
            "Palanpur",
            "Jahangirpura",
            "Rander",
            "Katargam",
            "Varachha",
            "Nana Varachha",
            "Mota Varachha",
            "Kapodra",
            "Sarthana",
            "Udhna",
            "Pandesara",
            "Dindoli",
            "Limbayat",
            "Bhatar",
            "Majura Gate",
            "Ring Road",
            "Bhestan",
            "Amroli",
            "Utran",
            "Sachin GIDC",
            "Hazira",
            "Kamrej",
            "Althan",
            "Magdalla",
            "Dumas Road",
            "Bhimrad",
            "Parvat Patiya",
            "Punagam",
            "Nanpura",
            "Gopipura",
            "Chowk Bazar",
            "Salabatpura",
            "Begampura",
            "Sagrampura",
            "Navsari Bazar",
            "Station Road",
            "Lal Darwaja",
            "Delhi Gate",
            "Sumul Dairy Road",
            "Olpad",
            "Icchhapore",
            "Anand Mahal Road",
            "New Textile Market",
        ],
    },
    "mumbai": {
        "label": "Mumbai",
        "center": (19.0760, 72.8777),
        "zoom": 11,
        "areas": [
            "Andheri",
            "Bandra",
            "Powai",
            "Lower Parel",
            "Worli",
            "Dadar",
            "Goregaon",
            "Malad",
            "Borivali",
            "Kandivali",
            "BKC",
            "Navi Mumbai",
            "Thane",
            "Vashi",
            "Chembur",
            "Ghatkopar",
            "Kurla",
            "Santacruz",
            "Juhu",
            "Colaba",
            "Fort",
            "Nariman Point",
            "Parel",
            "Sion",
        ],
    },
    "pune": {
        "label": "Pune",
        "center": (18.5204, 73.8567),
        "zoom": 12,
        "areas": [
            "Hinjewadi",
            "Baner",
            "Aundh",
            "Kothrud",
            "Wakad",
            "Kharadi",
            "Viman Nagar",
            "Hadapsar",
            "Magarpatta",
            "Shivaji Nagar",
            "Deccan",
            "Camp",
            "Pimple Saudagar",
            "Bavdhan",
            "Kalyani Nagar",
            "Swargate",
            "Katraj",
            "Warje",
        ],
    },
    "ahmedabad": {
        "label": "Ahmedabad",
        "center": (23.0225, 72.5714),
        "zoom": 12,
        "areas": [
            "SG Highway",
            "Satellite",
            "Prahlad Nagar",
            "Bodakdev",
            "Vastrapur",
            "Navrangpura",
            "CG Road",
            "Ashram Road",
            "Maninagar",
            "Iscon",
            "Thaltej",
            "Gota",
            "Chandkheda",
            "Naroda",
            "Odhav",
            "Vatva",
            "Science City",
            "Bopal",
            "Ambli",
            "Ellis Bridge",
        ],
    },
}

DEFAULT_CITY = "surat"

# Back-compat aliases used by older modules / docs.
SURAT_CENTER = CITIES["surat"]["center"]
SURAT_AREAS = CITIES["surat"]["areas"]
MAPS_ZOOM = 12

# --- niches ------------------------------------------------------------------

# Each niche is a list of Google Maps search phrases.
NICHES: dict[str, list[str]] = {
    "it": [
        "software company",
        "software development company",
        "IT company",
        "IT services company",
        "IT consulting",
        "web development company",
        "web design company",
        "website designer",
        "mobile app development company",
        "android app development company",
        "iphone app development company",
        "digital marketing agency",
        "seo company",
        "social media marketing agency",
        "ecommerce development company",
        "ui ux design agency",
        "graphic design agency",
        "animation studio",
        "game development company",
        "cloud computing service",
        "erp software company",
        "crm software company",
        "billing software company",
        "bpo company",
        "call center",
        "data entry service",
        "it staffing agency",
        "computer hardware shop",
        "cctv installation service",
        "networking company",
        "blockchain development company",
        "ai company",
    ],
    "food": [
        "restaurant",
        "cafe",
        "cloud kitchen",
        "bakery",
        "sweet shop",
        "catering service",
        "fast food restaurant",
        "hotel restaurant",
        "juice centre",
        "ice cream parlour",
        "food manufacturer",
        "tiffin service",
        "banquet hall",
    ],
    "business": [
        "company",
        "trading company",
        "wholesale trader",
        "exporter",
        "importer",
        "distributor",
        "office",
        "consultancy",
        "business centre",
        "corporate office",
    ],
    "textile": [
        "textile company",
        "textile mill",
        "saree manufacturer",
        "fabric wholesaler",
        "garment manufacturer",
        "embroidery works",
        "dyeing and printing mill",
        "textile machinery supplier",
        "yarn supplier",
        "textile exporter",
        "readymade garment shop",
        "textile agent",
        "cloth market",
    ],
    "diamond": [
        "diamond company",
        "diamond polishing factory",
        "diamond broker",
        "jewellery manufacturer",
        "gold jewellery wholesaler",
        "gem dealer",
        "diamond exporter",
        "jewellery designer",
    ],
    "manufacturing": [
        "manufacturing company",
        "engineering company",
        "plastic manufacturer",
        "chemical company",
        "packaging company",
        "steel fabrication",
        "machine shop",
        "industrial supplier",
        "cnc machining service",
    ],
    "services": [
        "chartered accountant",
        "law firm",
        "architect",
        "interior designer",
        "real estate agency",
        "travel agency",
        "logistics company",
        "advertising agency",
        "event management company",
        "placement agency",
        "insurance agency",
        "financial consultant",
        "printing press",
    ],
}

# Friendly labels shown in the interactive wizard.
NICHE_LABELS: dict[str, str] = {
    "it": "IT / Software companies",
    "food": "Food / Restaurants / Cafes",
    "business": "General businesses",
    "textile": "Textile / Garments",
    "diamond": "Diamond / Jewellery",
    "manufacturing": "Manufacturing / Engineering",
    "services": "Professional services (CA, law, design…)",
}

DEFAULT_NICHE = "it"
DEFAULT_TARGET = 500
# Hard ceiling for --target (prevents accidental huge runs / resource exhaustion).
MAX_TARGET = 5000
MIN_TARGET = 1
# Enrichment redirect / retry defaults
MAX_REDIRECTS = 5
HTTP_RETRY_ATTEMPTS = 3

# --- crawling behaviour ------------------------------------------------------

MAX_PAGES_PER_SITE = 6

CONTACT_PATH_GUESSES = [
    "/contact",
    "/contact-us",
    "/contactus",
    "/contact.html",
    "/contact-us.html",
    "/about",
    "/about-us",
    "/about.html",
    "/reach-us",
    "/get-in-touch",
    "/enquiry",
    "/careers",
    "/career",
    "/support",
]

CONTACT_LINK_HINTS = [
    "contact",
    "about",
    "reach",
    "connect",
    "enquir",
    "inquir",
    "support",
    "career",
    "job",
    "team",
    "hire",
    "get-in-touch",
    "getintouch",
    "write-to-us",
]

EMAIL_DOMAIN_BLOCKLIST = {
    "example.com",
    "example.org",
    "domain.com",
    "yourdomain.com",
    "email.com",
    "sentry.io",
    "sentry-next.wixpress.com",
    "wixpress.com",
    "wix.com",
    "godaddy.com",
    "squarespace.com",
    "shopify.com",
    "jquery.com",
    "w3.org",
    "schema.org",
    "google.com",
    "gstatic.com",
    "googleapis.com",
    "cloudflare.com",
    "bootstrapcdn.com",
    "fontawesome.com",
    "adobe.com",
    "mysite.com",
    "yoursite.com",
    "test.com",
    "abc.com",
    "xyz.com",
    "company.com",
    "placeholder.com",
    "no-reply.com",
    "npmjs.com",
    "github.com",
    "doe.com",
    "johndoe.com",
    "acme.com",
    "mail.com",
    "website.com",
    "sentry.wixpress.com",
    "elementor.com",
    "themeforest.net",
    "envato.com",
}

EMAIL_LOCALPART_BLOCKLIST = {
    "example",
    "youremail",
    "your-email",
    "yourname",
    "name",
    "email",
    "user",
    "username",
    "someone",
    "test",
    "test123",
    "abc",
    "xyz",
    "filler",
    "sample",
    "demo",
    "noreply-example",
}

EMAIL_FAKE_TLDS = {
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "bmp",
    "ico",
    "css",
    "js",
    "json",
    "xml",
    "php",
    "html",
    "htm",
    "woff",
    "woff2",
    "ttf",
    "eot",
    "mp4",
    "pdf",
    "zip",
    "webmanifest",
}

# --- pacing ------------------------------------------------------------------

MAPS_DELAY = 1.8
SEARCH_DELAY = 1.5
ENRICH_CONCURRENCY = 16
SITE_TIMEOUT = 18

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
]

# --- output ------------------------------------------------------------------

DATA_DIR = "data"
SCRAPED_DIR = "data"  # CSVs live in data/ (no separate folder, no .db)
DB_PATH = ""  # unused — store is CSV-backed
DEFAULT_CSV = os.path.join(DATA_DIR, "companies.csv")

CSV_COLUMNS = [
    "company_name",
    "website",
    "email_primary",
    "emails_all",
    "phone_primary",
    "phones_all",
    "address",
    "area",
    "category",
    "rating",
    "review_count",
    "linkedin",
    "facebook",
    "instagram",
    "sources",
    "maps_url",
    "first_seen",
    "last_enriched",
]


# --- helpers -----------------------------------------------------------------

_SLUG_RE = re.compile(r"[^a-z0-9]+")
_UNSAFE_PATH_RE = re.compile(r"[^a-zA-Z0-9._\-]+")


def slugify(value: str) -> str:
    text = (value or "").strip().lower().replace("&", " and ")
    text = _SLUG_RE.sub("_", text).strip("_")
    # Reject path traversal fragments that could survive earlier cleaning.
    text = text.replace("..", "_").strip("._")
    return (text[:80] if text else "") or "custom"


def safe_filename_component(value: str) -> str:
    """Sanitize a single path segment for output filenames (no separators)."""
    text = slugify(value)
    text = _UNSAFE_PATH_RE.sub("_", text).strip("._")
    if not text or text in {".", ".."}:
        return "custom"
    return text[:80]


def resolve_city(city: str) -> dict[str, Any]:
    """
    Return a city profile. Unknown cities get a sensible default center in
    India and an empty area list (city-wide searches only).
    """
    key = slugify(city)
    if key in CITIES:
        profile = dict(CITIES[key])
        profile["key"] = key
        return profile

    label = city.strip().title() or "Unknown"
    return {
        "key": key or "custom",
        "label": label,
        "center": (20.5937, 78.9629),  # India centroid fallback
        "zoom": 11,
        "areas": [],
    }


def niche_categories(niche: str) -> list[str]:
    """Return search phrases for a known niche, or [niche] as a custom phrase."""
    key = slugify(niche)
    if key in NICHES:
        return list(NICHES[key])
    phrase = niche.strip()
    return [phrase] if phrase else list(NICHES[DEFAULT_NICHE])


def niche_slug(niche: str) -> str:
    key = slugify(niche)
    return key if key in NICHES else slugify(niche) or "custom"


def build_queries(
    niche: str,
    city: str = DEFAULT_CITY,
    areas: list[str] | None = None,
) -> list[tuple[str, str]]:
    """
    Produce (search phrase, area) pairs.

    - areas is a non-empty list → ONLY those towns (no city-wide bleed)
    - areas is [] → city-wide only
    - areas is None → city-wide first, then every known locality
    """
    profile = resolve_city(city)
    city_label = profile["label"]
    categories = niche_categories(niche)

    if areas is None:
        area_list = list(profile.get("areas") or [])
        queries = [(f"{category} in {city_label}", "") for category in categories]
        for area in area_list:
            area = area.strip()
            if not area:
                continue
            for category in categories:
                queries.append((f"{category} in {area} {city_label}", area))
        return queries

    if not areas:
        return [(f"{category} in {city_label}", "") for category in categories]

    queries: list[tuple[str, str]] = []
    for area in areas:
        area = area.strip()
        if not area:
            continue
        for category in categories:
            # Lead with the locality so Maps ranks local results first.
            queries.append((f"{category} in {area}, {city_label}", area))
    return queries


def job_db_path(city: str, niche: str) -> str:
    """Deprecated: CSV store path (kept name for older call sites)."""
    return output_csv_path(city, niche)


def output_csv_path(
    city: str,
    niche: str,
    when: datetime | None = None,
    *,
    output_dir: str | Path | None = None,
) -> str:
    """
    Unique CSV under data/ (or *output_dir*):

        data/surat_it_2026-09-15.csv
    """
    directory = Path(output_dir) if output_dir else Path(DATA_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    when = when or datetime.now()
    base = f"{safe_filename_component(city)}_{safe_filename_component(niche_slug(niche))}_{when.strftime('%Y-%m-%d')}"
    path = directory / f"{base}.csv"
    if not path.exists():
        return str(path)
    return str(directory / f"{base}_{when.strftime('%H%M%S')}.csv")

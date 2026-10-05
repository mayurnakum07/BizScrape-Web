"""
Tunable settings for BizScrape.

Static defaults (cities, niches, timeouts, crawl limits) live here.
Per-run user settings (city, niche, target, sources, output, concurrency)
come from the CLI / interactive wizard - you should not need to edit Python
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
    "newyork": {
        "label": "New York",
        "center": (40.7128, -74.0060),
        "zoom": 12,
        "country_code": "+1",
        "areas": [
            "Manhattan",
            "Brooklyn",
            "Queens",
            "Bronx",
            "Staten Island",
            "Harlem",
            "Upper East Side",
            "Upper West Side",
            "Chelsea",
            "Greenwich Village",
            "SoHo",
            "Tribeca",
            "Chinatown",
            "Financial District",
            "Williamsburg",
            "DUMBO",
            "Astoria",
            "Flushing",
            "Long Island City",
            "Jamaica",
        ],
    },
    "toronto": {
        "label": "Toronto",
        "center": (43.6510, -79.3470),
        "zoom": 11,
        "country_code": "+1",
        "areas": [
            "Downtown",
            "North York",
            "Scarborough",
            "Etobicoke",
            "York",
            "East York",
            "Mississauga",
            "Brampton",
            "Markham",
            "Vaughan",
            "Richmond Hill",
            "Oakville",
            "Burlington",
            "Milton",
        ],
    },
    "london": {
        "label": "London",
        "center": (51.5072, -0.1276),
        "zoom": 12,
        "country_code": "+44",
        "areas": [
            "City of London",
            "Westminster",
            "Kensington",
            "Chelsea",
            "Camden",
            "Islington",
            "Hackney",
            "Tower Hamlets",
            "Greenwich",
            "Lewisham",
            "Southwark",
            "Lambeth",
            "Wandsworth",
            "Hammersmith",
            "Fulham",
        ],
    },
    "sydney": {
        "label": "Sydney",
        "center": (-33.8688, 151.2093),
        "zoom": 12,
        "country_code": "+61",
        "areas": [
            "CBD",
            "North Sydney",
            "Parramatta",
            "Chatswood",
            "Bondi",
            "Manly",
            "Newtown",
            "Surry Hills",
            "Darlinghurst",
            "Paddington",
            "Glebe",
            "Balmain",
            "Coogee",
            "Cronulla",
        ],
    },
    "losangeles": {
        "label": "Los Angeles",
        "center": (34.0522, -118.2437),
        "zoom": 12,
        "country_code": "+1",
        "areas": [
            "Downtown",
            "Hollywood",
            "Santa Monica",
            "Beverly Hills",
            "Pasadena",
            "Burbank",
            "Glendale",
            "Long Beach",
            "Westwood",
            "Culver City",
            "Silver Lake",
            "Venice",
        ],
    },
    "chicago": {
        "label": "Chicago",
        "center": (41.8781, -87.6298),
        "zoom": 12,
        "country_code": "+1",
        "areas": [
            "Loop",
            "River North",
            "Lincoln Park",
            "West Loop",
            "Wicker Park",
            "Lakeview",
            "Logan Square",
            "Hyde Park",
        ],
    },
    "sanfrancisco": {
        "label": "San Francisco",
        "center": (37.7749, -122.4194),
        "zoom": 12,
        "country_code": "+1",
        "areas": [
            "SoMa",
            "Financial District",
            "Mission District",
            "Marina",
            "Pacific Heights",
            "Castro",
            "Sunset",
            "Richmond",
        ],
    },
    "mumbai": {
        "label": "Mumbai",
        "center": (19.0760, 72.8777),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Andheri",
            "Bandra",
            "BKC",
            "Nariman Point",
            "Powai",
            "Lower Parel",
            "Dadar",
            "Borivali",
            "Thane",
            "Navi Mumbai",
            "Malad",
            "Goregaon",
            "Juhu",
            "Worli",
        ],
    },
    "delhi": {
        "label": "Delhi",
        "center": (28.6139, 77.2090),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Connaught Place",
            "Nehru Place",
            "South Extension",
            "Saket",
            "Karol Bagh",
            "Lajpat Nagar",
            "Rohini",
            "Dwarka",
            "Janakpuri",
            "Noida",
            "Gurgaon",
        ],
    },
    "bengaluru": {
        "label": "Bengaluru",
        "center": (12.9716, 77.5946),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Koramangala",
            "Indiranagar",
            "Whitefield",
            "HSR Layout",
            "Electronic City",
            "Jayanagar",
            "Marathahalli",
            "BTM Layout",
            "Malleshwaram",
            "Bellandur",
            "JP Nagar",
        ],
    },
    "surat": {
        "label": "Surat",
        "center": (21.1702, 72.8311),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Ring Road",
            "Varachha",
            "Adajan",
            "Vesu",
            "Piplod",
            "Katargam",
            "Athwa",
            "Udhna",
            "Rander",
            "City Light",
            "Althan",
            "Pal",
        ],
    },
    "ahmedabad": {
        "label": "Ahmedabad",
        "center": (23.0225, 72.5714),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "SG Highway",
            "Prahlad Nagar",
            "Navrangpura",
            "Bodakdev",
            "Satellite",
            "Vastrapur",
            "Ashram Road",
            "Maninagar",
            "CG Road",
            "Thaltej",
        ],
    },
    "pune": {
        "label": "Pune",
        "center": (18.5204, 73.8567),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Hinjewadi",
            "Baner",
            "Kothrud",
            "Viman Nagar",
            "Kharadi",
            "Kalyani Nagar",
            "Shivajinagar",
            "Magarpatta",
            "Hadapsar",
            "Wakad",
        ],
    },
    "hyderabad": {
        "label": "Hyderabad",
        "center": (17.3850, 78.4867),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Hitech City",
            "Madhapur",
            "Gachibowli",
            "Banjara Hills",
            "Jubilee Hills",
            "Kondapur",
            "Begumpet",
            "Secunderabad",
            "Kukatpally",
        ],
    },
    "chennai": {
        "label": "Chennai",
        "center": (13.0827, 80.2707),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "T Nagar",
            "OMR",
            "Guindy",
            "Velachery",
            "Anna Nagar",
            "Adyar",
            "Nungambakkam",
            "Alwarpet",
            "Mylapore",
        ],
    },
    "kolkata": {
        "label": "Kolkata",
        "center": (22.5726, 88.3639),
        "zoom": 12,
        "country_code": "+91",
        "areas": [
            "Salt Lake",
            "Park Street",
            "New Town",
            "BBD Bagh",
            "Ballygunge",
            "Alipore",
            "Howrah",
            "Sector V",
        ],
    },
    "paris": {
        "label": "Paris",
        "center": (48.8566, 2.3522),
        "zoom": 12,
        "country_code": "+33",
        "areas": [
            "Le Marais",
            "Montmartre",
            "La Defense",
            "Latin Quarter",
            "Bastille",
            "Saint-Germain",
        ],
    },
    "berlin": {
        "label": "Berlin",
        "center": (52.5200, 13.4050),
        "zoom": 12,
        "country_code": "+49",
        "areas": [
            "Mitte",
            "Kreuzberg",
            "Friedrichshain",
            "Charlottenburg",
            "Prenzlauer Berg",
            "Schoneberg",
        ],
    },
    "tokyo": {
        "label": "Tokyo",
        "center": (35.6762, 139.6503),
        "zoom": 12,
        "country_code": "+81",
        "areas": [
            "Shibuya",
            "Shinjuku",
            "Ginza",
            "Roppongi",
            "Akihabara",
            "Chiyoda",
            "Minato",
        ],
    },
    "singapore": {
        "label": "Singapore",
        "center": (1.3521, 103.8198),
        "zoom": 12,
        "country_code": "+65",
        "areas": [
            "Raffles Place",
            "Marina Bay",
            "Orchard",
            "Tanjong Pagar",
            "Jurong",
            "Bugis",
        ],
    },
    "dubai": {
        "label": "Dubai",
        "center": (25.2048, 55.2708),
        "zoom": 12,
        "country_code": "+971",
        "areas": [
            "Downtown",
            "Business Bay",
            "Dubai Marina",
            "JLT",
            "Deira",
            "Bur Dubai",
            "DIFC",
            "Al Barsha",
        ],
    },
}

DEFAULT_CITY = "newyork"

# Back-compat aliases used by older modules / docs.
NEWYORK_CENTER = CITIES["newyork"]["center"]
NEWYORK_AREAS = CITIES["newyork"]["areas"]
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
VERIFY_SSL = os.getenv("BIZSCRAPE_VERIFY_SSL", "false").lower() in ("true", "1", "yes")

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

MAPS_DELAY = 1.0
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
DB_PATH = ""  # unused - store is CSV-backed
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


def _match_city_key(key: str) -> str | None:
    """Find matching key in CITIES considering underscores or no underscores."""
    if not key:
        return None
    compact = key.replace("_", "")
    for candidate in (key, compact):
        if candidate in CITIES:
            return candidate
    for city_key in CITIES:
        if city_key.replace("_", "") == compact:
            return city_key
    return None


def resolve_city(city: str, country: str = "") -> dict[str, Any]:
    """
    Return a city profile. Supports composite city strings (e.g. "New York, NY, USA",
    "London, UK", "Surat, Gujarat, India"), normalized city keys, and smart
    international country/coordinate inference.
    """
    raw = (city or "").strip()
    # Check if city contains commas (e.g. "City, State, Country")
    parts = [p.strip() for p in raw.split(",") if p.strip()] if "," in raw else [raw]
    primary = parts[0] if parts else "Unknown"

    full_key = slugify(raw)
    primary_key = slugify(primary)

    # 1. Try exact or compact match for full string or primary component
    matched_key = _match_city_key(full_key) or _match_city_key(primary_key)
    if matched_key:
        profile = dict(CITIES[matched_key])
        profile["key"] = matched_key
        # If the input was more detailed (e.g. "Manhattan, New York"), preserve useful label
        return profile

    # 2. Check for country indications in the combined string
    combined = f"{raw} {country}".lower()
    label = primary.title() or "Unknown"

    # International inference defaults
    if any(term in combined for term in ("india", "gujarat", "maharashtra", "karnataka", "tamil nadu", "delhi")):
        country_code = "+91"
        center = (20.5937, 78.9629)
    elif any(term in combined for term in ("united kingdom", "england", "scotland", "wales")) or "uk" in combined.split():
        country_code = "+44"
        center = (51.5072, -0.1276)
    elif any(term in combined for term in ("australia", "nsw", "queensland", "victoria")) or "au" in combined.split():
        country_code = "+61"
        center = (-33.8688, 151.2093)
    elif any(term in combined for term in ("canada", "ontario", "quebec", "alberta", "bc")) or "ca" in combined.split():
        country_code = "+1"
        center = (43.6510, -79.3470)
    elif any(term in combined for term in ("france", "paris")):
        country_code = "+33"
        center = (48.8566, 2.3522)
    elif any(term in combined for term in ("germany", "deutschland", "berlin")):
        country_code = "+49"
        center = (52.5200, 13.4050)
    elif any(term in combined for term in ("dubai", "uae", "united arab emirates", "abu dhabi")):
        country_code = "+971"
        center = (25.2048, 55.2708)
    elif "singapore" in combined:
        country_code = "+65"
        center = (1.3521, 103.8198)
    elif any(term in combined for term in ("japan", "tokyo")):
        country_code = "+81"
        center = (35.6762, 139.6503)
    else:
        country_code = "+1"
        center = (37.0902, -95.7129)  # USA centroid fallback

    return {
        "key": full_key or "custom",
        "label": label,
        "center": center,
        "zoom": 11,
        "country_code": country_code,
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
    - areas is [] or None → city-wide first, then all known localities
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
                queries.append((f"{category} in {area}, {city_label}", area))
        if not area_list:
            for quad in ("Downtown", "North", "South", "East", "West", "Central"):
                for category in categories:
                    queries.append((f"{category} in {quad} {city_label}", ""))
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

        data/newyork_it_2026-09-15.csv
    """
    directory = Path(output_dir) if output_dir else Path(DATA_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    when = when or datetime.now()
    base = f"{safe_filename_component(city)}_{safe_filename_component(niche_slug(niche))}_{when.strftime('%Y-%m-%d')}"
    path = directory / f"{base}.csv"
    if not path.exists():
        return str(path)
    return str(directory / f"{base}_{when.strftime('%H%M%S')}.csv")

"""
Town / locality accuracy helpers.

Google Maps often returns businesses from neighbouring areas (e.g. Udhna when
you asked for Manhattan). Every record is checked against the requested
locality before it is kept.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

from . import config, utils

# Alternate spellings people (and Maps) use for the same place.
AREA_ALIASES: dict[str, tuple[str, ...]] = {
    "mota varachha": ("mota varachha", "mota varacha", "mota varcha", "motavarachha"),
    "nana varachha": ("nana varachha", "nana varacha", "nanavarachha"),
    "varachha": ("varachha", "varacha", "varcha"),
    "ghod dod road": ("ghod dod", "ghoddod", "ghod dod road"),
    "city light": ("city light", "citylight"),
    "sachin gidc": ("sachin gidc", "sachin"),
    "new textile market": ("new textile market", "textile market"),
    "ring road": ("ring road", "ring rd"),
    "sg highway": ("sg highway", "s.g. highway", "s g highway"),
    "bkc": ("bkc", "banda kurla", "bandra kurla"),
    "navi toronto": ("navi toronto", "nerul", "belapur"),
    "hinjewadi": ("hinjewadi", "hinjavadi", "hinjewadi phase"),
    "viman nagar": ("viman nagar", "vimannagar"),
    "kalyani nagar": ("kalyani nagar", "kalyaninagar"),
}

# Rough map centres so area searches zoom into the right neighbourhood.
AREA_CENTERS: dict[str, tuple[float, float]] = {
    # New York
    "adajan": (21.1956, 72.7933),
    "vesu": (21.1415, 72.7708),
    "piplod": (21.1570, 72.7750),
    "athwa": (21.1700, 72.7950),
    "katargam": (21.2300, 72.8300),
    "varachha": (21.2200, 72.8600),
    "nana varachha": (21.2280, 72.8700),
    "mota varachha": (21.2380, 72.8880),
    "udhna": (21.1620, 72.8410),
    "pandesara": (21.1450, 72.8450),
    "ring road": (21.1850, 72.8330),
    "sarthana": (21.2450, 72.9000),
    "kapodra": (21.2150, 72.8550),
    "amroli": (21.2550, 72.8550),
    "sachin gidc": (21.0850, 72.8700),
    "hazira": (21.1200, 72.6500),
    "althan": (21.1550, 72.7900),
    "bhatar": (21.1600, 72.8100),
    # Toronto
    "andheri": (19.1197, 72.8468),
    "bandra": (19.0596, 72.8295),
    "powai": (19.1176, 72.9060),
    "bkc": (19.0670, 72.8680),
    "navi toronto": (19.0330, 73.0297),
    "thane": (19.2183, 72.9781),
    # Sydney
    "hinjewadi": (18.5912, 73.7389),
    "baner": (18.5590, 73.7868),
    "kharadi": (18.5510, 73.9420),
    "hadapsar": (18.5089, 73.9260),
    "viman nagar": (18.5679, 73.9143),
    # London
    "sg highway": (23.0400, 72.5100),
    "satellite": (23.0250, 72.5100),
    "maninagar": (22.9970, 72.6000),
}


def _norm(text: str) -> str:
    text = utils.clean_text(text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def area_key(area: str) -> str:
    return _norm(area)


def aliases_for(area: str) -> list[str]:
    key = area_key(area)
    aliases = list(AREA_ALIASES.get(key, ()))
    if key and key not in aliases:
        aliases.insert(0, key)
    # Also accept the raw area without spaces for dense addresses.
    compact = key.replace(" ", "")
    if compact and compact not in aliases:
        aliases.append(compact)
    return aliases


def center_for(area: str, city: str | None = None) -> tuple[float, float] | None:
    key = area_key(area)
    if key in AREA_CENTERS:
        return AREA_CENTERS[key]
    for alias in aliases_for(area):
        if alias in AREA_CENTERS:
            return AREA_CENTERS[alias]
    if city:
        return config.resolve_city(city)["center"]
    return None


def _haystack(record: dict) -> str:
    parts = [
        record.get("address") or "",
        record.get("area") or "",
        record.get("name") or "",
        record.get("category") or "",
    ]
    return _norm(" ".join(parts))


def _other_city_areas(city: str, expected: str) -> list[str]:
    """Known localities in this city that are NOT the expected one."""
    profile = config.resolve_city(city)
    expected_key = area_key(expected)
    expected_aliases = set(aliases_for(expected))
    others: list[str] = []
    for area in profile.get("areas") or []:
        key = area_key(area)
        if key == expected_key or key in expected_aliases:
            continue
        # Don't treat a parent token as "other" when expected is more specific
        # (e.g. expected Manhattan should still reject plain Varachha hits
        # that don't also say Mota - handled in matches_area).
        others.append(area)
    return others


def matches_area(record: dict, expected_area: str, city: str = "") -> bool:
    """
    True when the business clearly belongs to expected_area.

    Rules:
      1. Address/name must mention the area (or an alias).
      2. If it mentions a different known locality more strongly, reject it.
      3. For nested names (Manhattan vs Varachha), require the full form.
    """
    expected = (expected_area or "").strip()
    if not expected:
        return True  # city-wide search - keep everything in the city

    hay = _haystack(record)
    if not hay:
        return False

    aliases = aliases_for(expected)
    # Prefer longer aliases first (mota varachha before varachha).
    aliases = sorted(set(aliases), key=len, reverse=True)

    hit = next((alias for alias in aliases if alias and alias in hay), "")
    if not hit:
        return False

    # Reject clear wrong-neighbourhood hits: address names another locality
    # and does NOT also contain our expected area as the primary place.
    for other in _other_city_areas(city, expected):
        other_aliases = aliases_for(other)
        other_hit = next((a for a in sorted(other_aliases, key=len, reverse=True) if a in hay), "")
        if not other_hit:
            continue
        # If the other locality string is longer/more specific than our hit,
        # or appears as a distinct place, treat as mismatch.
        if len(other_hit) >= len(hit) and other_hit not in hit and hit not in other_hit:
            return False
        if other_hit != hit and other_hit not in expected.lower() and hit not in other_hit:
            # e.g. expected mota varachha, hay has udhna + somehow mota - rare;
            # if both appear, require expected alias present (already true) and
            # prefer keeping only when expected alias is present - already is.
            # Strong reject when wrong area appears and expected is only in name spam.
            addr = _norm(record.get("address") or "")
            if other_hit in addr and hit not in addr:
                return False

    return True


def filter_records(
    records: Iterable[dict],
    expected_area: str,
    city: str = "",
) -> tuple[list[dict], list[dict]]:
    """Split into (kept, rejected_wrong_area)."""
    kept: list[dict] = []
    rejected: list[dict] = []
    for record in records:
        if matches_area(record, expected_area, city=city):
            # Stamp the requested area so CSV stays consistent.
            if expected_area:
                record = dict(record)
                record["area"] = expected_area
            kept.append(record)
        else:
            rejected.append(record)
    return kept, rejected


def stricter_query(query: str, area: str, city_label: str) -> str:
    """Second-pass query when the first pass kept almost nothing."""
    area = area.strip()
    if not area:
        return query
    # Quoted locality forces Maps to prefer that token.
    return f'{query.split(" in ")[0].strip()} near "{area}" {city_label}'

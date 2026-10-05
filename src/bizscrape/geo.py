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
    # New York
    "manhattan": ("manhattan", "midtown", "downtown manhattan"),
    "brooklyn": ("brooklyn", "bklyn"),
    "queens": ("queens",),
    "bronx": ("bronx", "the bronx"),
    "staten island": ("staten island",),
    "upper east side": ("upper east side", "ues"),
    "upper west side": ("upper west side", "uws"),
    "soho": ("soho",),
    "tribeca": ("tribeca",),
    "financial district": ("financial district", "fidi"),
    "williamsburg": ("williamsburg",),
    "long island city": ("long island city", "lic"),
    # Toronto
    "north york": ("north york",),
    "scarborough": ("scarborough",),
    "etobicoke": ("etobicoke",),
    "mississauga": ("mississauga",),
    "richmond hill": ("richmond hill",),
    # London
    "city of london": ("city of london", "the city", "square mile"),
    "tower hamlets": ("tower hamlets",),
    "hammersmith": ("hammersmith",),
    # Sydney
    "cbd": ("cbd", "central business district", "sydney cbd"),
    "north sydney": ("north sydney",),
    "surry hills": ("surry hills",),
    # Mumbai
    "andheri": ("andheri", "andheri west", "andheri east"),
    "bandra": ("bandra", "bandra west", "bandra east"),
    "bkc": ("bkc", "bandra kurla complex"),
    # Bengaluru
    "koramangala": ("koramangala",),
    "indiranagar": ("indiranagar",),
    "whitefield": ("whitefield",),
    # Surat
    "ring road": ("ring road",),
    "varachha": ("varachha", "mota varachha", "nana varachha"),
    "adajan": ("adajan",),
    "vesu": ("vesu",),
}

# Rough map centres so area searches zoom into the right neighbourhood.
AREA_CENTERS: dict[str, tuple[float, float]] = {
    # New York
    "manhattan": (40.7831, -73.9712),
    "brooklyn": (40.6782, -73.9442),
    "queens": (40.7282, -73.7949),
    "bronx": (40.8448, -73.8648),
    "staten island": (40.5795, -74.1502),
    "harlem": (40.8116, -73.9465),
    "upper east side": (40.7736, -73.9566),
    "upper west side": (40.7870, -73.9754),
    "chelsea": (40.7465, -74.0014),
    "greenwich village": (40.7336, -74.0027),
    "soho": (40.7233, -73.9985),
    "tribeca": (40.7163, -74.0086),
    "chinatown": (40.7158, -73.9970),
    "financial district": (40.7075, -74.0113),
    "williamsburg": (40.7081, -73.9571),
    "dumbo": (40.7033, -73.9881),
    "astoria": (40.7720, -73.9301),
    "flushing": (40.7654, -73.8318),
    "long island city": (40.7440, -73.9489),
    "jamaica": (40.7028, -73.7901),
    # Toronto
    "downtown": (43.6510, -79.3837),
    "north york": (43.7615, -79.4111),
    "scarborough": (43.7731, -79.2577),
    "etobicoke": (43.6205, -79.5132),
    "mississauga": (43.5890, -79.6441),
    "brampton": (43.7315, -79.7624),
    "markham": (43.8561, -79.3370),
    "vaughan": (43.8563, -79.5085),
    "richmond hill": (43.8828, -79.4403),
    # London
    "city of london": (51.5155, -0.0922),
    "westminster": (51.4975, -0.1357),
    "kensington": (51.4990, -0.1941),
    "camden": (51.5390, -0.1426),
    "islington": (51.5362, -0.1033),
    "hackney": (51.5450, -0.0553),
    "tower hamlets": (51.5154, -0.0726),
    "greenwich": (51.4769, 0.0005),
    "southwark": (51.5035, -0.0804),
    "lambeth": (51.4861, -0.1160),
    "wandsworth": (51.4571, -0.1818),
    "hammersmith": (51.4927, -0.2248),
    "fulham": (51.4828, -0.1950),
    # Sydney
    "cbd": (-33.8688, 151.2093),
    "north sydney": (-33.8390, 151.2070),
    "parramatta": (-33.8150, 151.0011),
    "chatswood": (-33.7969, 151.1832),
    "bondi": (-33.8915, 151.2767),
    "manly": (-33.7970, 151.2878),
    "newtown": (-33.8977, 151.1788),
    "surry hills": (-33.8836, 151.2113),
    # Mumbai
    "andheri": (19.1136, 72.8697),
    "bandra": (19.0596, 72.8295),
    "bkc": (19.0674, 72.8689),
    # Bengaluru
    "koramangala": (12.9352, 77.6245),
    "indiranagar": (12.9784, 77.6408),
    "whitefield": (12.9698, 77.7500),
    # Surat
    "ring road": (21.1860, 72.8485),
    "varachha": (21.2173, 72.8665),
    "adajan": (21.1959, 72.7933),
    "vesu": (21.1418, 72.7709),
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
    True when the business plausibly belongs to expected_area.

    Lenient approach: keep records unless they clearly belong to a DIFFERENT
    known area or a completely different city. Records with no area info at all
    are kept (they probably belong to the searched locality but just don't
    mention it in their brief address text).
    """
    expected = (expected_area or "").strip()
    if not expected:
        return True  # city-wide search - keep everything

    aliases = aliases_for(expected)
    aliases = sorted(set(aliases), key=len, reverse=True)

    # 1. If record explicitly carries an area tag:
    rec_area = _norm(record.get("area") or "")
    if rec_area:
        if any(alias in rec_area or rec_area in alias for alias in aliases):
            return True
        if len(rec_area) >= 3 and rec_area not in aliases:
            # Explicitly tagged with a different locality/area → reject
            return False

    hay = _haystack(record)
    if not hay:
        return True  # no data to check - keep it

    # 2. Positive match: area name appears in the record text → definitely keep
    hit = next((alias for alias in aliases if alias and alias in hay), "")
    if hit:
        return True

    # 3. Contradiction checks against address:
    addr = _norm(record.get("address") or "")
    if not addr:
        return True  # no address to contradict - keep

    # Reject if address explicitly mentions a DIFFERENT known city
    current_profile = config.resolve_city(city) if city else {}
    current_label = _norm(current_profile.get("label", ""))
    for c_key, c_prof in config.CITIES.items():
        c_label = _norm(c_prof.get("label", ""))
        if c_label and c_label != current_label:
            # Match city name as a distinct word in address
            if re.search(r"\b" + re.escape(c_label) + r"\b", addr):
                return False

    # Reject if address explicitly mentions a DIFFERENT known area in this city
    for other in _other_city_areas(city, expected):
        other_aliases = aliases_for(other)
        other_hit = next(
            (a for a in sorted(other_aliases, key=len, reverse=True) if re.search(r"\b" + re.escape(a) + r"\b", addr)),
            "",
        )
        if other_hit and len(other_hit) >= 3:
            return False

    # No contradicting city or area found - keep the record
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

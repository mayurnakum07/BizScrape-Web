"""
Internal data model for a business row.

The public CSV schema remains the 18-column layout in ``config.CSV_COLUMNS``.
``BusinessRecord`` is the typed in-memory view used by the pipeline and store.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class BusinessRecord:
    """One company as stored/merged by BizScrape."""

    name: str = ""
    website: str = ""
    address: str = ""
    area: str = ""
    category: str = ""
    rating: float | None = None
    review_count: int | None = None
    maps_url: str = ""
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    linkedin: str = ""
    facebook: str = ""
    instagram: str = ""
    source: str = ""
    sources: str = ""
    first_seen: str = ""
    last_enriched: str = ""
    enrich_status: str = ""
    enrich_note: str = ""
    id: int | None = None

    def to_store_dict(self) -> dict[str, Any]:
        """Shape expected by ``Store.upsert`` / enrichment helpers."""
        return {
            "id": self.id,
            "name": self.name,
            "website": self.website,
            "address": self.address,
            "area": self.area,
            "category": self.category,
            "rating": self.rating,
            "review_count": self.review_count,
            "maps_url": self.maps_url,
            "emails": list(self.emails),
            "phones": list(self.phones),
            "linkedin": self.linkedin,
            "facebook": self.facebook,
            "instagram": self.instagram,
            "source": self.source,
            "sources": self.sources,
            "first_seen": self.first_seen,
            "last_enriched": self.last_enriched,
            "enrich_status": self.enrich_status,
            "enrich_note": self.enrich_note,
        }

    @classmethod
    def from_discovery(cls, record: dict[str, Any]) -> BusinessRecord:
        """Normalize a scraper dict into a BusinessRecord."""
        return cls(
            name=str(record.get("name") or ""),
            website=str(record.get("website") or ""),
            address=str(record.get("address") or ""),
            area=str(record.get("area") or ""),
            category=str(record.get("category") or ""),
            rating=record.get("rating"),
            review_count=record.get("review_count"),
            maps_url=str(record.get("maps_url") or ""),
            emails=list(record.get("emails") or []),
            phones=list(record.get("phones") or []),
            linkedin=str(record.get("linkedin") or ""),
            facebook=str(record.get("facebook") or ""),
            instagram=str(record.get("instagram") or ""),
            source=str(record.get("source") or ""),
        )


# Field-level merge rules (documented for contributors - implemented in Store._merge):
# - Prefer non-empty scalars; longer address wins
# - Union phones/emails/sources without duplicates
# - Never reset first_seen on update
# - Company website upgrades from empty/non-company to a real company site
MERGE_RULES = """
prefer_non_empty, longer_address, union_multi_value, preserve_first_seen
"""

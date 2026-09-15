"""Discovery source adapters (Google Maps, Justdial, …)."""

from __future__ import annotations

from .gmaps import MapsScraper
from .justdial import JustdialScraper

__all__ = ["MapsScraper", "JustdialScraper"]

"""Backward-compatible re-export — prefer ``bizscrape.enrichment.site``."""

from bizscrape.enrichment.site import *  # noqa: F403
from bizscrape.enrichment.site import MAX_BYTES, SiteEnricher, _walk_json_ld  # noqa: F401

"""Structured errors for BizScrape."""

from __future__ import annotations


class BizScrapeError(Exception):
    """Base application error (exit code 1 by default)."""

    exit_code = 1


class UsageError(BizScrapeError):
    """Invalid CLI usage or configuration (exit code 2)."""

    exit_code = 2


class ProviderError(BizScrapeError):
    """External discovery/search provider failed."""


class EnrichmentError(BizScrapeError):
    """Website enrichment failed for a single target (usually non-fatal)."""


class StorageError(BizScrapeError):
    """CSV load/save failure."""

"""
Live integration tests - hit real external networks.

NOT run in default CI. Requires:

  BIZSCRAPE_LIVE_TESTS=1
  playwright install chromium

Run manually:

  BIZSCRAPE_LIVE_TESTS=1 python -m pytest tests/python/live -m live -q
"""

from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.live


def _live_enabled() -> bool:
    return os.environ.get("BIZSCRAPE_LIVE_TESTS", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@pytest.mark.asyncio
async def test_live_tiny_scrape_target_two() -> None:
    if not _live_enabled():
        pytest.skip("Set BIZSCRAPE_LIVE_TESTS=1 to run live scraper tests")

    from bizscrape.engine import ScrapeRunConfig, run_scrape

    cfg = ScrapeRunConfig(
        business_type="cafe",
        city="newyork",
        area="Brooklyn",
        target=2,
        sources=["gmaps"],
        out="data/live-test/results.csv",
    )
    result = await run_scrape(cfg)
    assert result.cancelled is False
    assert isinstance(result.records, list)

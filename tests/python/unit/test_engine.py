"""Engine boundary unit tests (no live scrape)."""

from __future__ import annotations

from bizscrape.engine import ScrapeRunConfig, config_to_namespace


def test_config_to_namespace_maps_fields() -> None:
    cfg = ScrapeRunConfig(
        business_type="cafe",
        city="New York",
        area="Manhattan",
        target=20,
        sources=["gmaps"],
        out="data/test.csv",
    )
    ns = config_to_namespace(cfg)
    assert ns.niche == "cafe"
    assert ns.city == "New York"
    assert ns.target == 20
    assert ns.area_list == ["Manhattan"]
    assert ns.source == "gmaps"
    assert ns.out == "data/test.csv"


def test_config_clamps_target() -> None:
    cfg = ScrapeRunConfig(
        business_type="it",
        city="newyork",
        target=99999,
        out="data/x.csv",
    )
    ns = config_to_namespace(cfg)
    assert ns.target == 5000

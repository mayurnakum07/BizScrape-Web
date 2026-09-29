from bizscrape import geo


def test_filter_keeps_matching_area():
    records = [
        {
            "name": "Local Cafe",
            "address": "Ring Road, Manhattan, New York",
            "area": "Manhattan",
            "source": "gmaps",
        },
        {
            "name": "Far Away",
            "address": "Andheri West, Toronto",
            "area": "Andheri",
            "source": "gmaps",
        },
    ]
    kept, rejected = geo.filter_records(records, "Manhattan", city="newyork")
    names = {r["name"] for r in kept}
    assert "Local Cafe" in names
    assert any(r["name"] == "Far Away" for r in rejected)


def test_filter_city_wide_keeps_all_with_empty_expected():
    records = [{"name": "A", "address": "New York", "area": "", "source": "gmaps"}]
    kept, rejected = geo.filter_records(records, "", city="newyork")
    assert len(kept) == 1
    assert rejected == []

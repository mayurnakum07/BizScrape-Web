from bizscrape import geo


def test_filter_keeps_matching_area():
    records = [
        {
            "name": "Local Cafe",
            "address": "Ring Road, Mota Varachha, Surat",
            "area": "Mota Varachha",
            "source": "gmaps",
        },
        {
            "name": "Far Away",
            "address": "Andheri West, Mumbai",
            "area": "Andheri",
            "source": "gmaps",
        },
    ]
    kept, rejected = geo.filter_records(records, "Mota Varachha", city="surat")
    names = {r["name"] for r in kept}
    assert "Local Cafe" in names
    assert any(r["name"] == "Far Away" for r in rejected)


def test_filter_city_wide_keeps_all_with_empty_expected():
    records = [{"name": "A", "address": "Surat", "area": "", "source": "gmaps"}]
    kept, rejected = geo.filter_records(records, "", city="surat")
    assert len(kept) == 1
    assert rejected == []

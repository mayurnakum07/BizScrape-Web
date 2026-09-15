from bizscrape import config


def test_build_queries_area_only():
    queries = config.build_queries("it", city="surat", areas=["Mota Varachha"])
    assert queries
    assert all("Mota Varachha" in q for q, _ in queries)
    assert all(area == "Mota Varachha" for _, area in queries)


def test_build_queries_city_wide():
    queries = config.build_queries("food", city="mumbai", areas=[])
    assert queries
    assert all(area == "" for _, area in queries)
    assert all("Mumbai" in q for q, _ in queries)


def test_safe_filename_blocks_traversal():
    assert ".." not in config.safe_filename_component("../etc/passwd")
    assert "/" not in config.safe_filename_component("a/b")
    assert config.safe_filename_component("") == "custom"


def test_output_csv_path(tmp_path):
    path = config.output_csv_path("surat", "it", output_dir=tmp_path)
    assert path.startswith(str(tmp_path))
    assert "surat_it_" in path
    assert path.endswith(".csv")

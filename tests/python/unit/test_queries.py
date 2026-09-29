from bizscrape import config


def test_build_queries_area_only():
    queries = config.build_queries("it", city="newyork", areas=["Manhattan"])
    assert queries
    assert all("Manhattan" in q for q, _ in queries)
    assert all(area == "Manhattan" for _, area in queries)


def test_build_queries_city_wide():
    queries = config.build_queries("food", city="toronto", areas=[])
    assert queries
    assert all(area == "" for _, area in queries)
    assert all("Toronto" in q for q, _ in queries)


def test_safe_filename_blocks_traversal():
    assert ".." not in config.safe_filename_component("../etc/passwd")
    assert "/" not in config.safe_filename_component("a/b")
    assert config.safe_filename_component("") == "custom"


def test_output_csv_path(tmp_path):
    path = config.output_csv_path("newyork", "it", output_dir=tmp_path)
    assert path.startswith(str(tmp_path))
    assert "newyork_it_" in path
    assert path.endswith(".csv")

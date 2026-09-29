from bizscrape.cli import main


def test_dry_run_exits_zero_no_network(capsys):
    code = main(
        [
            "discover",
            "--city",
            "newyork",
            "--niche",
            "it",
            "--areas",
            "Manhattan",
            "--source",
            "gmaps",
            "--target",
            "5",
            "--dry-run",
            "--yes",
        ]
    )
    assert code == 0
    out = capsys.readouterr().out
    assert "Dry run" in out or "planned" in out.lower() or "queries" in out.lower()


def test_invalid_usage_exit_code():
    code = main(["discover", "--target", "0", "--yes"])
    assert code == 2

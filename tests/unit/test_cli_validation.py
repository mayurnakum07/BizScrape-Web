import pytest

from bizscrape.cli import build_parser, validate_args
from bizscrape.errors import UsageError


def test_target_bounds():
    parser = build_parser()
    args = parser.parse_args(["discover", "--target", "0", "--yes"])
    with pytest.raises(UsageError) as exc:
        validate_args(args)
    assert exc.value.exit_code == 2


def test_target_too_large():
    parser = build_parser()
    args = parser.parse_args(["discover", "--target", "99999", "--yes"])
    with pytest.raises(UsageError):
        validate_args(args)


def test_invalid_source():
    parser = build_parser()
    args = parser.parse_args(["discover", "--source", "facebook", "--yes"])
    with pytest.raises(UsageError) as exc:
        validate_args(args)
    assert "gmaps" in str(exc.value)


def test_valid_sources_alias():
    parser = build_parser()
    args = parser.parse_args(["discover", "--sources", "gmaps", "--target", "10", "--yes"])
    validate_args(args)
    assert args.source == "gmaps"


def test_wizard_not_for_yes(monkeypatch):
    from bizscrape import cli

    monkeypatch.setattr(cli.sys, "argv", ["bizscrape", "run", "--yes"])
    args = build_parser().parse_args(["run", "--yes", "--city", "surat"])
    assert not cli._should_open_wizard(args)

import pytest

from bizscrape.security import hostname_is_literal_blocked, validate_fetch_url


def test_blocks_localhost_and_private_literals():
    assert hostname_is_literal_blocked("localhost")
    assert hostname_is_literal_blocked("127.0.0.1")
    assert hostname_is_literal_blocked("10.0.0.5")
    assert hostname_is_literal_blocked("192.168.1.1")
    assert hostname_is_literal_blocked("169.254.169.254")


def test_validate_fetch_url_scheme():
    with pytest.raises(ValueError):
        validate_fetch_url("file:///etc/passwd", resolve=False)
    with pytest.raises(ValueError):
        validate_fetch_url("ftp://example.com", resolve=False)
    with pytest.raises(ValueError):
        validate_fetch_url("javascript:alert(1)", resolve=False)
    with pytest.raises(ValueError):
        validate_fetch_url("data:text/html,hello", resolve=False)


def test_validate_allows_public_hostname_without_resolve():
    url = validate_fetch_url("https://example.com/contact", resolve=False)
    assert url.startswith("https://")

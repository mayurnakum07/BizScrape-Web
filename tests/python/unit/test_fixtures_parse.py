from pathlib import Path

from bizscrape.enrichment.site import SiteEnricher


def test_fixture_contact_page(fixtures_dir: Path):
    html = (fixtures_dir / "company_contact.html").read_text(encoding="utf-8")
    emails: list[str] = []
    phones: list[str] = []
    socials: dict[str, str] = {}
    SiteEnricher._harvest(html, "https://acme-widgets.example", emails, phones, socials)
    assert "contact@acme-widgets.example" in emails or "sales@acme-widgets.example" in emails

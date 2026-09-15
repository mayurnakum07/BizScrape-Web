from bizscrape.enrichment.site import SiteEnricher


def test_harvest_emails_from_html():
    html = """
    <html><body>
      <a href="mailto:info@acme.example">Email</a>
      <a href="https://linkedin.com/company/acme">LI</a>
      <a href="tel:+919811122233">Call</a>
      Contact sales [at] acme [dot] example for quotes.
    </body></html>
    """
    emails: list[str] = []
    phones: list[str] = []
    socials: dict[str, str] = {}
    SiteEnricher._harvest(html, "https://acme.example", emails, phones, socials)
    assert "info@acme.example" in emails
    assert socials.get("linkedin")
    assert any(p.startswith("+91") for p in phones)

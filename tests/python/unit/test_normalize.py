from bizscrape import utils


def test_normalize_phone_mobile():
    assert utils.normalize_phone("9876543211") == "+19876543211"
    assert utils.normalize_phone("+1 98765 43211") == "+19876543211"
    assert utils.normalize_phone("019876543211") == "+19876543211"


def test_normalize_phone_rejects_garbage():
    assert utils.normalize_phone("1234567890") is None
    assert utils.normalize_phone("0000000000") is None
    assert utils.normalize_phone("pin 395006") is None


def test_email_extract_and_rank():
    text = "Contact info@acme.in or noreply@acme.in also sales@gmail.com"
    emails = utils.extract_emails(text)
    assert "info@acme.in" in emails
    primary = utils.pick_primary_email(emails, "https://www.acme.in")
    assert primary == "info@acme.in"


def test_normalize_email_blocklist():
    assert utils.normalize_email("test@example.com") is None
    assert utils.normalize_email("user@sentry.io") is None


def test_canonical_url_and_company_site():
    assert utils.canonical_url("acme.in/path?utm_source=x") == "https://acme.in/path"
    assert utils.is_company_website("https://acme.in")
    assert not utils.is_company_website("https://facebook.com/acme")


def test_slugify_name_legal_suffix():
    assert utils.slugify_name("Acme Tech Pvt. Ltd.") == utils.slugify_name("Acme Tech")

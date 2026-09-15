# Contributing to BizScrape

Thanks for helping improve BizScrape. Please keep changes small, tested, and free of real scraped contact data.

## Setup

```bash
git clone <your-fork-url>
cd bizscrape
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

python -m pip install -U pip
python -m pip install -e ".[dev]"
python -m playwright install chromium
```

Supported Python: **3.10+**

## Run locally

```bash
bizscrape --help
python -m bizscrape run --dry-run --city surat --niche it --source gmaps --target 5 --yes
python main.py --help   # thin compatibility wrapper
```

## Tests

Default suite is **offline** (no Google Maps / Justdial / live websites):

```bash
pytest
# or
pytest -m "not live"
```

Live tests (if added later) must be marked `@pytest.mark.live` and are excluded from CI.

## Lint / format / types

```bash
ruff check src tests
ruff format src tests
mypy src/bizscrape
```

## Architecture (where to change what)

| Area | Location |
|------|----------|
| CLI / validation | `src/bizscrape/cli.py` |
| Pipeline stages | `src/bizscrape/pipeline.py` |
| Google Maps / Justdial | `src/bizscrape/sources/` |
| Website search | `src/bizscrape/search/` |
| Email crawl | `src/bizscrape/enrichment/` |
| CSV store / dedupe | `src/bizscrape/store.py` |
| SSRF helpers | `src/bizscrape/security.py` |
| Cities / niches / defaults | `src/bizscrape/config.py` |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Adding a source adapter

1. Implement a small scraper module under `sources/`.
2. Keep HTML selectors inside that module.
3. Emit dicts compatible with `Store.upsert` (`name`, `phones`, `website`, `address`, `source`, …).
4. Wire the source in `pipeline.py` behind the existing `--source` flag.
5. Add offline fixtures/tests; do not depend on live sites in CI.

## Pull requests

- Prefer focused PRs over large rewrites.
- Do not add CAPTCHA bypass, login/paywall bypass, email-sending, or telemetry.
- Do not commit CSVs with real personal data.
- Update docs when CLI or CSV behavior changes.

## Code of conduct

Please follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

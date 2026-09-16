# Tests

Layered suites for BizScrape Web. **Defaults do not call Google Maps.**

| Layer | Path | Command |
|-------|------|---------|
| Frontend unit | `tests/unit/` | `npm test` |
| Python unit + API integration | `tests/python/` | `python -m pytest tests/python -q` |
| E2E (mock provider) | `e2e/` | `npm run test:e2e` |
| Live scraper | `tests/python/live/` | `BIZSCRAPE_LIVE_TESTS=1 python -m pytest tests/python/live -m live -q` |

Full guide: [docs/TESTING.md](../docs/TESTING.md).

Shared Python helpers: `tests/python/helpers.py` (fake scrapers for integration).

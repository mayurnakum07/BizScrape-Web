# Testing guide

BizScrape Web uses layered tests so each layer has a clear purpose. **Default CI and local suites do not hit Google Maps or live websites.**

## Test layers

| Layer | Location | Purpose | External network |
|-------|----------|---------|------------------|
| **Unit** | `tests/unit/`, `tests/python/unit/` | Deterministic logic (validation, CSV, reducer, security) | No |
| **Integration** | `tests/python/integration/` | API routes + job manager with fake scraper | No |
| **API** | Same integration folder | HTTP contract for `/jobs`, SSE, cancel, results | No |
| **Frontend** | `tests/unit/*.tsx` | Components, a11y (jest-axe), responsive helpers | No |
| **E2E** | `e2e/` | Browser flow against production Next.js build + mock provider | No |
| **Smoke** | `tests/python/integration/test_smoke.py`, [SMOKE_TEST.md](SMOKE_TEST.md) | Minimal post-deploy acceptance | No (automated) |
| **Live** | `tests/python/live/` | Real Playwright scrape | **Yes - manual only** |

```text
Browser → Next.js → Python API → Engine → External sources
  E2E(mock)   unit     integration(fake)     live (manual)
```

---

## Quick commands

```bash
# Frontend unit tests
npm test

# Frontend E2E (production build + mock provider)
npm run test:e2e

# Python unit + integration (excludes live)
python -m pytest tests/python -q

# Live scraper (manual - needs Maps/network)
BIZSCRAPE_LIVE_TESTS=1 python -m pytest tests/python/live -m live -q

# Full local quality gate (no E2E)
npm run lint && npm run typecheck && npm test && npm run build && python -m pytest tests/python -q
```

---

## Unit tests

**Frontend (`tests/unit/`):**

- CSV schema, BOM, Unicode, formula injection
- Event reducer and duplicate handling
- Error code mapping
- Responsive breakpoints and filter helpers
- Accessibility (jest-axe) on key components

**Python (`tests/python/unit/`):**

- API validation, security, SSE bus
- CLI validation, store, enrichment parsing
- CSV integrity with real `csv` module
- Engine helpers, geo, normalization

---

## Backend integration tests

Uses `tests/python/helpers.py` fake scrapers - **no Playwright in default integration suite**.

Coverage includes:

- `POST /jobs`, `GET /jobs/:id`, SSE, results, CSV, cancel, retry
- Concurrent job isolation
- Cancellation at discovery/enrichment
- SSE replay and terminal close
- API validation (malformed payloads)
- Pipeline failure / empty results
- In-memory restart behavior
- Bounded event buffers and activity logs

Shared fixture: `api_client` in `tests/python/conftest.py`.

---

## Live integration tests

Marked `@pytest.mark.live`. **Excluded from CI** via `pyproject.toml`:

```toml
addopts = "-q --strict-markers -m 'not live'"
```

Run only when you intentionally verify real scraping:

```bash
playwright install chromium
BIZSCRAPE_LIVE_TESTS=1 python -m pytest tests/python/live -m live -q
```

External sites may be rate-limited, restyled, or unavailable - failures are environmental, not necessarily regressions.

---

## End-to-end browser tests

Playwright (`e2e/`) runs against **`npm run build && npm run start`** on port **3001** (avoids clashing with `npm run dev` on 3000) with `NEXT_PUBLIC_API_URL` unset (mock provider).

| Spec | Verifies |
|------|----------|
| `mock-happy-path.spec.ts` | Landing → form → job → results → export button |
| `mock-errors.spec.ts` | Form validation, unknown job page |
| `mock-scenarios.spec.ts` | Cancel, failure + retry, SSE disconnect/reconnect |
| `responsive.spec.ts` | No horizontal overflow at 320–1920px |

Install browsers once:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

---

## Security & accessibility regression

- Security: `tests/python/unit/test_api_security.py`, `test_security.py`
- Accessibility: `tests/unit/accessibility.test.tsx`
- Responsive helpers: `tests/unit/responsive.test.ts`, `tests/unit/viewports.test.ts`

Re-run these after refactors touching validation, CORS, CSV, or UI interaction.

---

## Performance regression

`tests/unit/results-performance.test.ts` - large dataset filter/summary paths (Milestone 12).

---

## CLI regression

Python CLI tests live in `tests/python/unit/test_cli_validation.py` and `tests/python/integration/test_cli_dry_run.py`.

```bash
python -m pytest tests/python/unit/test_cli_validation.py tests/python/integration/test_cli_dry_run.py -q
bizscrape --help
```

---

## Clean-clone test (new developer)

```bash
git clone <repo>
cd BizScrape\ Web
python -m venv .venv && .\.venv\Scripts\Activate.ps1   # or source .venv/bin/activate
pip install -e ".[dev]"
playwright install chromium
npm ci
copy .env.example .env.local
python -m pytest tests/python -q
npm test
npm run build
```

No personal paths, global packages, or credentials required.

---

## Failure recovery (documented behavior)

| Scenario | Expected |
|----------|----------|
| API restart during active job | Job lost (404); scrape may orphan browser until process exit |
| API restart after completion | Job lost from memory; CSV may remain on disk if persisted volume |
| SSE disconnect | Client reconnects with backoff; hydrates via GET |

See `tests/python/integration/test_failure_recovery.py`.

---

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `python -m pytest tests/python -q` (excludes live)
- `npm run test:e2e` (Playwright + production build)

CI does **not** depend on live Maps scraping.

---

## Flaky tests

Do not add arbitrary retries to hide flakes. If Playwright timing fails, fix selectors or waits. E2E uses `retries: 0`.

---

## Release candidate

See [RELEASE_CANDIDATE.md](RELEASE_CANDIDATE.md).

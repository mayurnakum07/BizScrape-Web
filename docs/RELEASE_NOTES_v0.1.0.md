# BizScrape Web v0.1.0

**Status:** Initial public alpha - web UI + API + Python engine in one repository.

## What exists

- **Next.js web UI** - landing, scrape configuration, live job progress (SSE), results table, CSV download
- **FastAPI job service** - create/cancel/retry jobs, SSE events, results + server CSV export
- **Python BizScrape engine** - Maps discovery, website lookup, enrichment, deduplication, CSV (same as CLI)
- **Mock job provider** - local UI development and Playwright E2E when `NEXT_PUBLIC_API_URL` is unset

## Install (summary)

```bash
git clone https://github.com/mayurnakum07/BizScrape.git
cd BizScrape
python -m venv .venv && source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
playwright install chromium
npm ci
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL for live API
python -m bizscrape.api      # terminal A
npm run dev                  # terminal B
```

Full guide: [README.md](../README.md)

## Architecture notes

- Frontend talks to Python API via REST + SSE (`NEXT_PUBLIC_API_URL`)
- Job state is **in-memory** per API process - restart loses job metadata
- CSV files persist under `JOB_DATA_DIR` on disk
- Designed for **single API instance** with long-running Playwright jobs

## Known limitations (honest)

- External sources (Google Maps, websites) can block, rate-limit, or change layout
- Emails come from company websites - often empty
- No user authentication - protect the API at the network layer
- In-process rate limits - not suitable for multi-instance without shared store
- `0.1.0` is **not** a 1.0 stability promise

## Test coverage at release

- Frontend: lint, typecheck, 44 unit tests, production build, 24 Playwright E2E (mock)
- Python: 109 pytest tests (integration uses fake scraper; live tests manual only)
- CI: `.github/workflows/ci.yml`

## Upgrade / versioning

- Tag: `v0.1.0`
- Surfaces share version `0.1.0` in `package.json` and `pyproject.toml`
- CLI releases and web releases are the same repo until split

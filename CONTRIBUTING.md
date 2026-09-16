# Contributing

Thanks for helping with **BizScrape Web**.

This repository contains:

1. The **Next.js** web UI
2. The **FastAPI** job API
3. The **Python BizScrape engine** (shared with the CLI)

Scraping behavior belongs in `src/bizscrape/`. The UI should stay a thin client over that engine — do not reimplement Maps/enrichment in TypeScript.

## Local setup

Requirements: **Node.js 20.9+**, **Python 3.10+**.

```bash
git clone https://github.com/mayurnakum07/BizScrape.git
cd BizScrape

python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
playwright install chromium

copy .env.example .env.local   # or: cp .env.example .env.local
npm install
```

### Develop

```bash
# Terminal A — API (optional if you only need the mock UI)
python -m bizscrape.api

# Terminal B — frontend
npm run dev
```

- UI: http://localhost:3000  
- API: http://127.0.0.1:8000  

Leave `NEXT_PUBLIC_API_URL` empty for mock jobs (no Maps).

## Branching

- Branch from `main`
- Prefer short, focused branches (`fix/…`, `docs/…`, `feat/…`)
- Keep PRs small enough to review in one sitting

## Code style

- TypeScript: follow existing patterns; run `npm run lint` and `npm run typecheck`
- Python: `ruff` config in `pyproject.toml`; prefer typed public APIs
- UI conventions: [docs/CONVENTIONS.md](docs/CONVENTIONS.md) and [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- Do not add UI libraries without a clear need
- Do not commit `.env*`, `node_modules`, `.next`, scraped CSV, or Playwright artifacts

## Tests

Default suites must not hit live Maps:

```bash
npm run lint
npm run typecheck
npm test
npm run build
python -m pytest tests/python -q
# Optional local E2E (spins production build on port 3001)
npm run test:e2e
```

Live scraper tests are **manual**:

```bash
# BIZSCRAPE_LIVE_TESTS=1 python -m pytest tests/python/live -m live -q
```

See [docs/TESTING.md](docs/TESTING.md).

## Pull requests

Use the PR template. Include:

- What changed and why
- How you tested it
- Screenshots for UI changes
- Note if docs need follow-up

## Suggested labels

Keep labels few and purposeful:

| Label | Use |
|-------|-----|
| `bug` | Defect |
| `enhancement` | Feature / improvement |
| `documentation` | Docs only |
| `scraper` | Source/layout/enrichment breakage |
| `security` | Only for tracking after private report (never dump exploit details) |

## Screenshots for docs

Real UI captures live under `docs/images/`. To refresh (dev server on `:3000`, mock provider OK):

```bash
node scripts/capture-docs-screenshots.mjs
# plus landing/configure waits in the same script family as needed
```

Do not invent mockups that do not match the running app.

## Code of conduct

[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

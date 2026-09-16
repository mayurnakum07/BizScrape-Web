# Changelog

All notable changes to this project are documented here.

This repository currently ships three surfaces under one version line (`0.1.x`):

| Surface | What ships |
|---------|------------|
| **Web UI** | Next.js App Router application |
| **API** | FastAPI job service (`python -m bizscrape.api`) |
| **CLI / engine** | `bizscrape` package and `main.py` |

## Versioning

- **Git tags** — Prefer annotated tags like `v0.1.0` on `main` when cutting a release.
- **GitHub Releases** — Attach release notes that say which surfaces changed (UI / API / CLI).
- **npm `package.json` / `pyproject.toml`** — Keep versions aligned unless you deliberately split packages later.
- Do not invent historical releases that were never tagged.

## Unreleased

Nothing yet.

## 0.1.0 — 2026-09-16 (initial public alpha)

See [docs/RELEASE_NOTES_v0.1.0.md](docs/RELEASE_NOTES_v0.1.0.md).

### Web UI

- Landing, scrape configuration, live job page (SSE), results review, CSV export
- Mock provider for UI-only dev; remote provider when `NEXT_PUBLIC_API_URL` is set
- Responsive layouts and accessibility checks (jest-axe)

### API

- FastAPI job routes, SSE event stream, cancel/retry, validation, rate limits, security headers
- In-memory job manager; CSV on disk under `JOB_DATA_DIR`

### Engine / CLI

- Python BizScrape pipeline (discover → website lookup → enrich → dedupe → export)
- CLI entry points: `python -m bizscrape`, `bizscrape`, `main.py`

### Testing & docs

- Layered tests: 44 frontend unit, 109 Python, 24 Playwright E2E (mock)
- Open-source docs: README, CONTRIBUTING, SECURITY, deployment, testing, screenshots

### Known limitations

- Single API instance; job state lost on restart
- External scraping depends on third-party site availability
- No user accounts

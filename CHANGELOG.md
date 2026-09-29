# Changelog

All notable changes to this project are documented here.

This repository currently ships three surfaces under one version line (`0.1.x`):

| Surface | What ships |
|---------|------------|
| **Web UI** | Next.js App Router application |
| **API** | FastAPI job service (`python -m bizscrape.api`) |
| **CLI / engine** | `bizscrape` package and `main.py` |

## Versioning

- **Git tags** - Prefer annotated tags like `v0.1.0` on `main` when cutting a release.
- **GitHub Releases** - Attach release notes that say which surfaces changed (UI / API / CLI).
- **npm `package.json` / `pyproject.toml`** - Keep versions aligned unless you deliberately split packages later.
- Do not invent historical releases that were never tagged.

## Unreleased

### Web UI

- Global design system: electric-lime signal on deep blue-black canvas, sharp radii, tokenized color/type/space/elevation/motion/focus/z-index
- New UI primitives: tabs, dropdown, tooltip, drawer, toast, loading/error panel states
- Removed glass/blur header treatment; aligned favicon and global chrome with the new palette
- Application shell: compact workspace header with active route state, quieter secondary nav, dense footer utility strip, skip-to-content
- Homepage: product-first landing with workspace hero (scrape → process → dataset), tighter sections, reduced card clutter
- Scrape config: query-builder workspace with grouped fields, live query summary, sticky Start scrape action
- Live job screen: extraction workspace with pipeline states, live metrics, capped activity feed, clearer complete/fail/cancel
- Scrape modal: compact configure → processing flow with smart defaults, inline validation, and terminal states in-panel
- Results workspace: dense sticky-header table, search/filter/sort, column visibility, density, row selection export, improved pagination
- Business detail drawer: right-rail desktop / full-screen mobile, sectioned fields, prev/next navigation, verified/missing states
- History workspace: compact run list with search/status filters, metrics, open/export/retry/delete, status-colored rails
- Saved datasets: persistent data workspace reusing live results controls, IndexedDB persistence banner, detail drawer
- Motion pass: fast/subtle transitions for nav, overlays, tables, controls, and state feedback; live loops only for running jobs; prefers-reduced-motion
- Workflow state system: shared catalog + panels for loading, empty, filtered, validation, scrape/export/IDB/network failures with recovery actions
- Performance: IndexedDB connection reuse + summary list reads, on-demand history export, deferred/transition filter work, lazy country package, non-blocking CSV serialize for large sets
- Cross-platform quality pass: a11y focus/keyboard for menus/tabs/dialogs, mobile selection + skeletons, touch targets, safe-area insets, sticky table column, M0 visual cleanup
- UX polish: full-viewport route loader, wider scrollable Start scrape modal, history name links + custom confirm dialogs, ink-black primary button text and dark selection on lime
- Flow fixes: scrape submit opens job page (not in-modal processing); closed dialogs no longer paint; CSV above filters; smaller detail drawer; body scroll lock; react-toastify for export/delete

## 0.1.0 - 2026-09-16 (initial public alpha)

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

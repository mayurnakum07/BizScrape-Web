# Architecture

BizScrape Web is a Next.js (App Router) front end for the BizScrape Python scraping engine.

The **Python engine** (CLI + FastAPI) is the source of truth for scraping, enrichment, and CSV export. The UI does not reimplement that engine in JavaScript.

This repository currently ships **UI + API + engine** together. The CLI (`bizscrape`) and the web job API call the same `engine` boundary.

## Deployment shape

```text
Browser
  ↓ HTTPS
Next.js (Vercel or similar)
  ↓ REST + SSE (NEXT_PUBLIC_API_URL)
Python FastAPI (VPS / Docker - long-running process)
  ↓ in-process JobManager
BizScrape engine
  ↓ Playwright + httpx
External sources → CSV on disk (JOB_DATA_DIR)
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting, [ENVIRONMENT.md](ENVIRONMENT.md) for variables, [DATA_SCHEMA.md](DATA_SCHEMA.md) for CSV fields, and [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md) for usage expectations.

## Module ownership (web)

| Area | Owns |
|------|------|
| `app/` | Routes, layouts, metadata, error/not-found/loading |
| `components/ui/` | Design-system primitives (Button, Field, Table, Terminal, …) |
| `components/layout/` | App shell, header, footer |
| `components/icons/` | Shared stroke icons |
| `lib/` | Env, errors, small utilities |
| `services/` | HTTP / job API clients - transport only |
| `services/scrape-job/` | Job facade + remote/mock providers |
| `types/` | Shared TypeScript contracts |
| `hooks/` | Client-side React hooks |

## Module ownership (Python)

| Area | Owns |
|------|------|
| `src/bizscrape/api/` | FastAPI routes, job manager, SSE, validation |
| `src/bizscrape/engine.py` | Programmatic scrape boundary for CLI + API |
| `src/bizscrape/sources/` | Maps discovery (Playwright) |
| `src/bizscrape/enrichment/` | Website contact enrichment (httpx) |
| `src/bizscrape/store.py` | CSV persistence |

Visual rules: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Job architecture: [`SCRAPE_JOB.md`](SCRAPE_JOB.md). Results: [`SCRAPE_RESULTS.md`](SCRAPE_RESULTS.md). CSV export: [`CSV_EXPORT.md`](CSV_EXPORT.md). Security: [`../SECURITY.md`](../SECURITY.md).

## Design rules

1. Keep scrape behavior in the Python engine.
2. Prefer thin services over heavy abstraction layers.
3. Server Components by default; add `"use client"` only when needed.
4. Do not commit scraped datasets or secrets.
5. No database until job persistence genuinely requires it.

## Current limitations

- Job state is **in-memory** (lost on API restart).
- **Single API instance** assumed for SSE and job ownership.
- CSV files persist on disk under `JOB_DATA_DIR` but job metadata does not survive restarts.

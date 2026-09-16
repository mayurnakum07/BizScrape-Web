# Deployment guide

BizScrape Web is designed for a **zero/low-budget** split deployment:

```text
GitHub
   │
   ├── Next.js frontend  (Vercel, Netlify, or static host)
   │
   └── Python API        (VPS, Railway free tier, Fly.io, Docker on a VM)
           └── Playwright + Chromium (long-running browser jobs)
```

There is **no database** in the current architecture. Job state lives in memory; CSV files live on disk under `JOB_DATA_DIR`.

---

## Architecture

```text
Browser
  ↓ HTTPS
Next.js (static/SSR UI, env-driven API URL)
  ↓ REST + SSE
Python FastAPI
  ↓ in-process JobManager
BizScrape engine
  ↓ Playwright (Maps) + httpx (website enrichment)
External sources → CSV on disk
```

### Runtime requirements

| Component | Requirement |
|-----------|-------------|
| **Frontend** | Node.js 20.9+, `npm run build` output |
| **Python API** | Python 3.10+, FastAPI, uvicorn |
| **Browser automation** | Playwright + Chromium (or system Chrome/Edge) |
| **Persistent storage** | Writable directory for `JOB_DATA_DIR` (CSV per job) |
| **Network** | Outbound HTTPS to Maps and company websites |

### What this is NOT suitable for

- **Serverless functions** for the Python API — scrape jobs are long-running (minutes) and need a persistent process.
- **Multi-instance API** without sticky sessions — job state is in-memory per process.
- **Free-tier hosts that sleep** — in-flight jobs are lost when the process stops.

---

## Environment separation

Use environment variables only — no hardcoded hostnames.

| Environment | Frontend URL | API URL | Notes |
|-------------|--------------|---------|-------|
| **Development** | `http://localhost:3000` | `http://127.0.0.1:8000` | Two terminals, mock provider if API URL unset |
| **Staging** | Platform preview URL | Staging API URL | Optional; only if you operate a staging API |
| **Production** | Vercel/host URL | Your API host URL | Set `DEBUG=false`, explicit CORS |

There is no fake staging infrastructure in the repo. Staging is supported by pointing env vars at a second API instance.

---

## Environment variables

Canonical table: [ENVIRONMENT.md](ENVIRONMENT.md) and [`.env.example`](../.env.example).

### Frontend (Next.js)

| Variable | Required | Exposure | Purpose |
|----------|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Browser | Canonical site URL for metadata |
| `NEXT_PUBLIC_API_URL` | For live API | Browser | Python API base URL |
| `NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS` | No | Browser | SSE reconnect budget (default 8) |
| `API_URL` | No | Server only | Server-side API URL (falls back to public URL) |

### Backend (Python API)

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` in Docker/VPS) |
| `PORT` | `8000` | Listen port |
| `ALLOWED_ORIGINS` | localhost origins | CORS allow-list (comma-separated, no `*`) |
| `DEBUG` | `false` | Enables OpenAPI docs when `true` |
| `LOG_LEVEL` | `INFO` | Python log level |
| `MAX_CONCURRENT_JOBS` | `1` | Running browser scrapes at once |
| `MAX_QUEUED_JOBS` | `5` | Extra queued jobs while busy |
| `MIN_API_TARGET` | `1` | Minimum scrape target |
| `MAX_API_TARGET` | `500` | Maximum scrape target |
| `MAX_JOB_RETRIES` | `3` | Retry limit per job lineage |
| `CANCEL_TIMEOUT_SECONDS` | `45` | Force-cancel watchdog |
| `RATE_LIMIT_CREATE_PER_MINUTE` | `10` | Job creation rate limit |
| `RATE_LIMIT_CANCEL_PER_MINUTE` | `30` | Cancel rate limit |
| `MAX_REQUEST_BODY_BYTES` | `65536` | Max POST body size |
| `SSE_MAX_RECONNECT_ATTEMPTS` | `8` | Documented backend default |
| `JOB_DATA_DIR` | `data/jobs` | Per-job CSV output root |
| `JOB_DATA_RETENTION_HOURS` | `168` | Delete stale job dirs on startup (0=off) |

See [`.env.example`](../.env.example) for development placeholders.

---

## Frontend deployment (Vercel or similar)

1. Connect the GitHub repository to Vercel (or another Next.js host).
2. Set environment variables in the host dashboard:

   ```text
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   NEXT_PUBLIC_API_URL=https://your-api.example.com
   NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS=8
   ```

3. Build command: `npm run build` (default for Next.js).
4. Output: Next.js App Router (no custom `vercel.json` required).

**Checks:**

- No hardcoded API hostname in source — all requests use `NEXT_PUBLIC_API_URL`.
- CSP `connect-src` in `next.config.ts` includes your API URL automatically.
- Client components only read `NEXT_PUBLIC_*` vars ([`lib/env.ts`](../lib/env.ts)).

---

## Python API deployment

### Option A — Docker (recommended for reproducibility)

```bash
docker build -t bizscrape-api .
docker run --rm -p 8000:8000 \
  -v bizscrape-jobs:/data/jobs \
  -e HOST=0.0.0.0 \
  -e ALLOWED_ORIGINS=https://your-app.vercel.app \
  -e DEBUG=false \
  -e MAX_CONCURRENT_JOBS=1 \
  bizscrape-api
```

The image uses Microsoft's Playwright Python base (`mcr.microsoft.com/playwright/python`) with Chromium pre-installed.

### Option B — Bare metal / VPS

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\Activate.ps1
pip install -e .
playwright install chromium        # or install Chrome/Edge system-wide

export HOST=0.0.0.0
export ALLOWED_ORIGINS=https://your-app.vercel.app
export DEBUG=false
export JOB_DATA_DIR=/var/lib/bizscrape/jobs

python -m bizscrape.api
```

Equivalent entry point: `uvicorn bizscrape.api.app:app --host 0.0.0.0 --port 8000`

### Playwright / Chromium

The engine tries system Chrome → Edge → Playwright Chromium. In containers, Playwright Chromium is the reliable path.

Install locally:

```bash
playwright install chromium
```

Do **not** assume serverless runtimes include a browser.

---

## Health and readiness

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness — process is up |
| `GET /health/ready` | Readiness — job data dir writable, Playwright importable |

Readiness does **not** launch a browser or start a scrape.

Docker `HEALTHCHECK` uses `/health`.

---

## SSE deployment

The UI uses `EventSource` to `GET /jobs/{id}/events`.

**Required proxy settings:**

- Disable response buffering for SSE routes.
- Allow long-lived connections (minutes, not seconds).
- nginx: `X-Accel-Buffering: no` is already set by the API; also configure `proxy_buffering off` for `/jobs/*/events`.

**Headers set by the API:**

```text
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

Keepalive comments (`: keepalive`) are sent every 15 seconds.

**Single-instance assumption:** SSE replay buffer is in-process. Multiple API replicas without sticky sessions will break live updates.

---

## Long-running jobs

```text
POST /jobs          → returns job ID immediately
Background task     → Playwright + enrichment (minutes)
GET /jobs/{id}/events → SSE progress stream
GET /jobs/{id}/results → structured results
GET /jobs/{id}/result  → CSV download
```

The HTTP request that creates a job does **not** wait for the scrape to finish. Do not deploy the Python API as a short-lived serverless function.

---

## Job persistence limitations

| Limitation | Detail |
|------------|--------|
| In-memory jobs | Restarting the API loses active/queued job state |
| No shared state | Multiple API instances do not share jobs or SSE buffers |
| No job history | Completed jobs exist only while the process runs |
| CSV on disk | Survive restart if `JOB_DATA_DIR` is on a persistent volume, but in-memory metadata is lost |

**First production deployment assumes one Python API instance.**

Do not enable auto-scaling to multiple API replicas until persistent job storage exists.

---

## File storage and cleanup

Each job writes to:

```text
{JOB_DATA_DIR}/{job_id}/results.csv
```

- Mount a persistent volume at `JOB_DATA_DIR` in production.
- `JOB_DATA_RETENTION_HOURS` (default 168) deletes stale job directories on API startup.
- Set to `0` to disable automatic cleanup.

Monitor disk usage on small VPS plans.

---

## Timeouts and resource limits

### API / job layer (env-configurable)

| Setting | Default | Purpose |
|---------|---------|---------|
| `MAX_CONCURRENT_JOBS` | 1 | Browser concurrency |
| `MAX_API_TARGET` | 500 | Max businesses per web job |
| `CANCEL_TIMEOUT_SECONDS` | 45 | Cancel watchdog |
| `MAX_JOB_RETRIES` | 3 | Retry ceiling |

### Engine layer (code defaults in `src/bizscrape/config.py`)

| Setting | Default | Purpose |
|---------|---------|---------|
| `SITE_TIMEOUT` | 18s | Website fetch timeout |
| `MAX_PAGES_PER_SITE` | 6 | Enrichment page cap |
| `MAX_REDIRECTS` | 5 | Redirect hop limit |
| `ENRICH_CONCURRENCY` | 16 | Parallel website fetches |
| Playwright page timeout | 30s | Maps interaction timeout |

These are tuned for real scraping — do not set arbitrarily low values.

---

## Production logging

Python logs use:

```text
%(asctime)s %(levelname)s [%(name)s] %(message)s
```

Structured fields in log messages include `job_id`, `event_id`, `request_id`, stages, and durations.

Do not log full datasets, cookies, or credentials. Set `LOG_LEVEL=INFO` in production.

---

## Security (Milestone 14)

Production deployment must use:

- `DEBUG=false`
- Explicit `ALLOWED_ORIGINS` (never `*`)
- Tuned `MAX_API_TARGET` and `MAX_CONCURRENT_JOBS`
- Rate limits enabled

See [SECURITY.md](../SECURITY.md).

---

## Local development

**Terminal 1 — Python API:**

```bash
pip install -e ".[dev]"
playwright install chromium
python -m bizscrape.api
```

**Terminal 2 — Next.js:**

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Zero-budget hosting notes

| Approach | Frontend | API | Caveats |
|----------|----------|-----|---------|
| Vercel free + VPS | Vercel | $5 VPS / Oracle free tier | API must stay awake; 1 concurrent job recommended |
| Vercel + Railway/Fly free | Vercel | Free container tier | May sleep; long jobs fail; RAM limits |
| Self-hosted Docker | Any static host or same VPS | Docker on same machine | Simplest for SSE; single instance |

Free providers may impose CPU/RAM limits, sleeping services, and no guaranteed browser support. Document limitations for operators — do not promise indefinite free-tier suitability for browser automation workloads.

---

## Smoke test

After deployment, run the checklist in [SMOKE_TEST.md](SMOKE_TEST.md).

Automated API smoke test:

```bash
python -m pytest tests/python/integration/test_smoke.py -q
```

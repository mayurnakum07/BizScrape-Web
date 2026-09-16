# Environment variables

Copy [`.env.example`](../.env.example) to `.env.local` for local development. Never commit real secrets.

`NEXT_PUBLIC_*` values are embedded in the browser bundle — treat them as public.

## Frontend (Next.js)

| Variable | Required | Public | Controls | Example |
|----------|----------|--------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Yes | Canonical origin for metadata / Open Graph | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | For live API | Yes | Python API base URL. **Empty** → mock job provider | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS` | No | Yes | Browser SSE reconnect budget (default 8) | `8` |
| `API_URL` | No | **No** | Server-side API base for Route Handlers; falls back to public URL | `http://127.0.0.1:8000` |

## Backend (Python API)

| Variable | Required | Public | Controls | Example / default |
|----------|----------|--------|----------|-------------------|
| `HOST` | No | No | Bind address | `127.0.0.1` (use `0.0.0.0` in Docker) |
| `PORT` | No | No | Listen port | `8000` |
| `ALLOWED_ORIGINS` | Yes in prod | No | CORS allow-list (comma-separated). Never `*` | `http://localhost:3000,http://127.0.0.1:3000` |
| `DEBUG` | No | No | When `true`, enables OpenAPI at `/docs` | `false` |
| `LOG_LEVEL` | No | No | Logging level | `INFO` |
| `MAX_CONCURRENT_JOBS` | No | No | Parallel live scrapes | `1` |
| `MAX_QUEUED_JOBS` | No | No | Extra jobs accepted while busy | `5` |
| `MIN_API_TARGET` / `MAX_API_TARGET` | No | No | Target businesses bounds | `1` / `500` |
| `MAX_JOB_RETRIES` | No | No | Retry limit for failed jobs | `3` |
| `CANCEL_TIMEOUT_SECONDS` | No | No | Cancel cleanup wait | `45` |
| `RATE_LIMIT_CREATE_PER_MINUTE` | No | No | Job create throttle per IP | `10` |
| `RATE_LIMIT_CANCEL_PER_MINUTE` | No | No | Cancel throttle per IP | `30` |
| `MAX_REQUEST_BODY_BYTES` | No | No | Request body size cap | `65536` |
| `SSE_MAX_RECONNECT_ATTEMPTS` | No | No | Backend SSE reconnect hint | `8` |
| `JOB_DATA_DIR` | No | No | On-disk job output root | `data/jobs` |
| `JOB_DATA_RETENTION_HOURS` | No | No | Delete stale job dirs on startup (`0` = off) | `168` |

## Safety notes

- There are **no API keys** required for the default Maps/website pipeline today — but do not paste credentials into env templates.
- Production: `DEBUG=false`, explicit `ALLOWED_ORIGINS`, HTTPS origins only.
- Rate limits are **in-process**; they reset per API instance.

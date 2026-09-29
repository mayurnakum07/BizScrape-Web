# Deployment smoke test

Use this checklist after deploying frontend + Python API to a new environment.

## Prerequisites

- [ ] Frontend URL loads (platform-generated URL is fine - no custom domain required)
- [ ] Python API `/health` returns `{"status":"ok"}`
- [ ] Python API `/health/ready` returns `{"status":"ok",...}` (503 = fix Playwright or disk permissions)
- [ ] `ALLOWED_ORIGINS` includes the frontend URL exactly (scheme + host, no trailing slash mismatch)
- [ ] `NEXT_PUBLIC_API_URL` points to the API (no trailing slash)
- [ ] `DEBUG=false` on the API

---

## Manual acceptance checklist

| # | Step | Expected |
|---|------|----------|
| 1 | Open homepage | Landing page renders, no console errors |
| 2 | Open `/scrape` | Scrape form loads |
| 3 | Submit a small job (target 5–10, city + niche) | Redirect to job page, job ID in URL |
| 4 | Watch job page | Status moves from queued → running |
| 5 | SSE connection | Progress/activity updates without full page refresh |
| 6 | Wait for completion | Status becomes `completed` (or `failed` with clear message) |
| 7 | Open results | `/scrape/job/{id}/results` shows records |
| 8 | Download CSV | Export or server CSV download works |
| 9 | Cancel test | Start a job, cancel - status becomes `cancelled` |
| 10 | Error state | Invalid form input shows validation error (no crash) |

---

## Automated API smoke test

Runs against an in-process test client (mocked scraper - no Playwright required):

```bash
python -m pytest tests/python/integration/test_smoke.py -q
```

For a live deployment, curl checks:

```bash
curl -s https://your-api.example.com/health
curl -s https://your-api.example.com/health/ready
```

---

## Production-style local test

Simulates production build + API:

```bash
# Terminal 1
python -m bizscrape.api

# Terminal 2
npm run build
npm run start

# Terminal 3
python -m pytest tests/python/integration/test_smoke.py -q
```

Then manually open `http://localhost:3000/scrape` and run steps 3–8 above.

---

## Common failures

| Symptom | Likely cause |
|---------|--------------|
| CORS error in browser | `ALLOWED_ORIGINS` missing frontend URL |
| SSE never connects | Proxy buffering; API unreachable from browser |
| Job stuck at queued | API not running or capacity full |
| `BROWSER_START_FAILED` | Playwright/Chromium not installed on API host |
| 429 on job create | Rate limit or queue capacity - wait and retry |
| Live updates stop | API restarted (in-memory state lost) or SSE exhausted |

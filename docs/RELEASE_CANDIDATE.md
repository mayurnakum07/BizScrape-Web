# Release candidate checklist

Complete before tagging a release.

## Environment

- [ ] `DEBUG=false` on production API
- [ ] Explicit `ALLOWED_ORIGINS` (no wildcard)
- [ ] `NEXT_PUBLIC_API_URL` points to production API
- [ ] `NEXT_PUBLIC_SITE_URL` points to production frontend
- [ ] No secrets in git or env templates

## Clean clone verification

```bash
git clone <repo>
cd BizScrape\ Web
python -m venv .venv && source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
playwright install chromium
npm ci
cp .env.example .env.local
```

## Automated gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
python -m pytest tests/python -q
npm run test:e2e
```

All must pass.

## Manual smoke ([SMOKE_TEST.md](SMOKE_TEST.md))

- [ ] Homepage loads
- [ ] Scrape form submits
- [ ] Job starts and completes (against real API in staging/prod)
- [ ] SSE progress visible
- [ ] Results page shows records
- [ ] CSV download works
- [ ] Cancel works
- [ ] Retry works (failed/cancelled job)

## Known limitations (document, do not hide)

- Single API instance; in-memory jobs
- API restart loses job state
- Live scraping depends on third-party site availability
- Free-tier hosts may not support long browser jobs

## Sign-off

| Check | Owner | Date |
|-------|-------|------|
| Automated tests green | | |
| Staging smoke passed | | |
| Security settings verified | | |
| Deployment docs current | | |

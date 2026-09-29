# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please report security issues **privately**.

1. Prefer [GitHub Security Advisories](https://github.com/mayurnakum07/BizScrape/security/advisories/new) for this repository (Private vulnerability reporting).
2. If advisories are unavailable, contact the repository owner through their [GitHub profile](https://github.com/mayurnakum07) - do not invent a public email for this policy.

Do **not** open a public issue that includes:

- Credentials, tokens, or `.env` contents
- Proof-of-exploit details that enable abuse before a fix
- Scraped personal contact datasets

Include: affected component (UI / API / engine), version or commit, reproduction steps, and impact.

## Scope

**In scope**

- Next.js frontend (XSS, unsafe rendering, env leakage, headers)
- FastAPI layer (validation, CORS, rate limits, SSRF boundaries, CSV export)
- Job lifecycle abuse (guessable IDs, cross-job access)
- Dependency issues in this repo’s lockfiles / `pyproject.toml`

**Out of scope**

- Scraping third-party sites in ways that violate their terms
- CAPTCHA / access-control bypass on external platforms
- Host OS compromise outside this application

## Product security notes

BizScrape discovers public business listings and enriches contact details from company-owned websites discovered during the pipeline. The API does **not** expose a generic “fetch any URL” endpoint.

Accepted MVP tradeoffs (not a claim of perfect security):

| Area | Limitation |
|------|------------|
| Authentication | No user accounts. Job access relies on UUID job IDs. |
| Rate limiting | In-process only; not shared across API instances. |
| TLS | Enrichment may skip strict verify for broken SME certificates. |
| Playwright | Container launches may use `--no-sandbox` for compatibility. |
| Shared host | Anyone who can reach the API can create jobs unless network-restricted. |

## Practices

- Never commit secrets or `.env.local`
- Keep `NEXT_PUBLIC_*` values safe for browser exposure
- Production: `DEBUG=false`, explicit `ALLOWED_ORIGINS` (never `*`)
- Tune `MAX_API_TARGET`, concurrency, and rate limits for your deployment
- Do not log full scrape datasets or credentials

See also [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) and [docs/RESPONSIBLE_USE.md](docs/RESPONSIBLE_USE.md).

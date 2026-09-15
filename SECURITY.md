# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please report security issues **privately** (GitHub Security Advisories on the repository, or email the maintainer listed on the GitHub profile).

Do **not** open a public issue that includes:

- exploit PoCs against third-party sites
- real personal contact datasets
- credentials, cookies, or session tokens

We aim to acknowledge reports within a reasonable time and to ship fixes in a patch release when practical.

## Security topics for this project

BizScrape fetches arbitrary company websites during enrichment. Relevant risks:

- **SSRF** — enrichment blocks localhost / private / link-local targets and re-checks URLs after redirects. Residual DNS-rebinding risk remains; treat enrichment as untrusted-input fetching.
- **Malicious HTML** — parsing uses BeautifulSoup; still avoid treating scraped text as trusted code.
- **Resource exhaustion** — timeouts, max pages per site, response size caps, and concurrency limits apply.
- **Path traversal** — output filename components are sanitized; prefer writing under `data/`.
- **TLS** — enrichment currently allows insecure SSL (`verify=False`) because many SME sites have broken certificates. This is a deliberate compatibility trade-off and a known risk.
- **No telemetry** — BizScrape does not phone home.
- **No outreach** — the tool does not send email, SMS, WhatsApp, or submit contact forms.

## Responsible disclosure scope

In-scope: flaws in this repository’s code (CLI, store, enrichment URL checks, path handling).

Out of scope: scraping third-party sites in ways that violate their terms, or requesting help to bypass CAPTCHAs / access controls.

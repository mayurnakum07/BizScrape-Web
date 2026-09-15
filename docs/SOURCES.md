# Sources

Honest limitations of each discovery / enrichment provider.

| Source | What it provides | Limitations |
|--------|------------------|-------------|
| Google Maps | Name, phone, website, address, rating, Maps URL | UI selectors break; rate limits; locality noise |
| Bing / DDG / Google search | Missing website candidates | Blocking; imperfect name→domain matching |
| Company websites | Public emails, phones, social links | Broken TLS, JS-only pages, obfuscation |

Justdial discovery was **removed** from BizScrape (unreliable data + forced visible browser).

## Crawl policy (enrichment)

- Only `http` / `https` URLs
- Block localhost / private / link-local / metadata-style targets
- Cap pages per domain, response size, redirects, and concurrency
- Do **not** submit contact forms or send outreach messages
- Do **not** bypass CAPTCHAs or logins
- TLS verification is currently disabled for SME certificate compatibility (documented risk)

## Robots.txt

BizScrape does **not** claim full automated robots.txt compliance in v0.1.
Operators must respect provider terms, robots rules, and applicable law.
Prefer modest targets, delays, and `--dry-run` to inspect planned queries.

## Maintenance

When Google Maps markup changes, fix selectors inside `sources/gmaps.py` and
add an offline HTML fixture if possible.

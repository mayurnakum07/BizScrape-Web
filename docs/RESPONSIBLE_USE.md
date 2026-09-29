# Responsible use

BizScrape discovers **public** business listings and enriches contact details from **publicly reachable company websites**. Use it like a careful operator, not a hammer.

## Do

- Collect publicly available business information for legitimate research, sales ops, or personal tooling.
- Keep scrape targets modest (`MAX_API_TARGET` exists for a reason).
- Expect incomplete rows - missing emails and websites are common.
- Store and share exported CSV in line with applicable privacy and marketing laws in your jurisdiction.

## Do not

- Scrape private, authenticated, or paywalled data.
- Bypass CAPTCHAs, login walls, or access controls.
- Run unbounded concurrent jobs against third-party sites.
- Use enrichment as a generic open proxy / URL fetcher (the API does not expose that).
- Publish scraped personal contact datasets in public GitHub issues.

## Practical realities

- Google Maps and other sources may rate-limit or block automated access.
- Source HTML/layout changes without notice - scrapers break.
- Website enrichment uses HTTP fetches with SSRF guards; many SME TLS setups are messy; some sites still fail.
- Results vary by city, niche, and day.

This document is practical guidance, not legal advice. You are responsible for how you run the tool.

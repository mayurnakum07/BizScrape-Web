# Data schema

BizScrape exports an **18-column** CSV (UTF-8 with BOM). Authoritative column order:

`services/export/csv/schema.ts` (frontend) and the Python store export path.

## Columns

| Field | Typical source | Notes |
|-------|----------------|-------|
| `company_name` | Listing | Required for a useful row |
| `website` | Listing and/or website lookup | May be empty |
| `email_primary` | Company website | Often empty |
| `emails_all` | Company website | `;`-separated when multiple |
| `phone_primary` | Listing and/or website | |
| `phones_all` | Listing and/or website | `;`-separated when multiple |
| `address` | Listing | |
| `area` | Listing / locality filter | |
| `category` | Listing | |
| `rating` | Listing | String as reported by source |
| `review_count` | Listing | |
| `linkedin` | Company website | |
| `facebook` | Company website | |
| `instagram` | Company website | |
| `sources` | Pipeline | e.g. `gmaps` |
| `maps_url` | Listing | |
| `first_seen` | Pipeline | ISO-ish timestamp |
| `last_enriched` | Pipeline | When enrichment last ran |

## Where data comes from

```text
Google Maps (listing)     → name, address, phone, rating, maps link, sometimes website
Website lookup            → fill missing website URL
Company website crawl     → emails, extra phones, social links when published
```

**Important:** Emails are extracted from **public business websites**, not from Google Maps listing cards. If a site has no mailto/contact page text, `email_primary` stays blank. That is expected, not always a bug.

## Honesty about missing fields

- Layout changes on Maps or directories break selectors → fewer/no rows.
- Sites that block bots → enrichment skips or fails for that URL.
- No website → no website-derived emails/socials.
- Deduplication may reduce row count vs “businesses found”.

UI results use the same field names as the CSV (`types/business-record.ts`).

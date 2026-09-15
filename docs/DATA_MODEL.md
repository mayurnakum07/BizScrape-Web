# Data model

## Public CSV schema (18 columns)

Order is fixed in `bizscrape.config.CSV_COLUMNS`:

| Column | Meaning |
|--------|---------|
| `company_name` | Business name |
| `website` | Company website URL |
| `email_primary` | Best-ranked email |
| `emails_all` | All emails (`"; "` separated) |
| `phone_primary` | First normalized phone |
| `phones_all` | All phones (`"; "` separated) |
| `address` | Free-text address |
| `area` | Locality stamp |
| `category` | Category / niche hint |
| `rating` | Maps rating if present |
| `review_count` | Review count if present |
| `linkedin` / `facebook` / `instagram` | Social profile URLs |
| `sources` | Provenance (`gmaps`, …) |
| `maps_url` | Google Maps place URL |
| `first_seen` | UTC ISO-8601 first insert |
| `last_enriched` | UTC ISO-8601 last enrichment |

Encoding: **UTF-8 with BOM** for Excel compatibility.

## Internal model

`BusinessRecord` (`models.py`) mirrors store rows. Scrapers still emit dicts;
`Store` remains the merge authority.

## Deduplication keys

1. Google Maps feature id (`g:…`)
2. Registrable company domain (`d:…`)
3. Normalized phone (`p:+91…`)
4. Slugified name (`n:…`) if length ≥ 6

## Merge rules

- Prefer non-empty scalar fields
- Longer address wins
- Union phones / emails / sources (order-preserving unique)
- Upgrading to a real company website resets enrichment to `pending`
- **Never** reset `first_seen` on update

## Resume semantics

Re-running against the same CSV path loads existing rows, merges duplicates,
and continues enrichment for `pending` / failed (with `--retry-failed`) sites.

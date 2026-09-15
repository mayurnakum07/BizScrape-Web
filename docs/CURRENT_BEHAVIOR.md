# BizScrape — Current Behavior Baseline

Observed before open-source hardening (2026-09-15). Do not treat this as the
final public API contract; it documents what the working tool did at audit time.

## Entry point

- Script: `python main.py <command>`
- Package (pre-rename): `suratscraper` (`__version__ = "2.0.0"`)
- Product name in docs/CLI: **BizScrape**

## Pipeline

```text
User input
  → Google Maps / optional Justdial discovery
  → Locality filter + dedupe + target cap
  → Missing website lookup (Bing / DDG / Google)
  → Website enrichment (emails, phones, social)
  → CSV export (18 columns, UTF-8 BOM)
```

## Commands

| Command | Behavior |
|---------|----------|
| `run` | Full pipeline; opens interactive wizard unless `--yes` or explicit `--city`/`--niche`/`--areas`/`--source` |
| `discover` | Maps and/or Justdial only |
| `websites` | Fill missing websites |
| `enrich` | Crawl company sites for emails |
| `export` | Rewrite CSV with optional `--require` filter |
| `stats` | Print store counts |

## Important flags

- `--city`, `--niche`, `--areas` (comma-separated), `--target`
- `--source` (`gmaps`, `justdial`, or `gmaps,justdial`)
- `--yes` — skip wizard
- `--out` / `--db` — CSV path (`--db` is legacy name; no SQLite)
- `--headful`, `--engine` (`bing`\|`ddg`\|`google`)
- `--concurrency`, `--skip-websites`, `--retry-failed`
- `--max-queries`, `--max-scrolls`, `--jd-channel`, `--jd-max`

## Interactive wizard

Asks: niche, city, area(s), sources, target, output path, website skip, search engine.
Never used when `--yes` is set or when key flags appear on `sys.argv`.

## Output

- Default path: `data/<city>_<niche>_YYYY-MM-DD.csv` (timestamp suffix if file exists)
- CSV columns (order fixed):  
  `company_name`, `website`, `email_primary`, `emails_all`, `phone_primary`,
  `phones_all`, `address`, `area`, `category`, `rating`, `review_count`,
  `linkedin`, `facebook`, `instagram`, `sources`, `maps_url`, `first_seen`,
  `last_enriched`
- Encoding: UTF-8 with BOM (Excel-friendly)
- Flush: after each Maps/Justdial query batch and periodically during websites/enrich

## Deduplication keys (Store)

1. Google Maps feature id (`g:0x…:0x…`)
2. Registrable website domain (`d:…`) when it looks like a company site
3. Normalized phones (`p:+91…`)
4. Slugified company name (`n:…`) if length ≥ 6

Merge prefers longer address, non-empty fields, union of phones/emails/sources;
does not reset `first_seen`.

## Locality filtering

`geo.filter_records` rejects results that do not match the expected area
(aliases + address heuristics). Area searches may retry once with a stricter
quoted query when too many wrong-area results appear.

## Target semantics

Upsert stops adding **new** rows once `store.count() >= target`. Existing rows
can still be updated/enriched.

## Ctrl+C

`shutdown.install()` registers SIGINT/SIGTERM (and Windows console handler).
On interrupt: best-effort CSV flush, kill browser process tree, exit 130.

## Network / browsers

- Maps / Justdial / Google searcher: Playwright (Chrome → Edge → Chromium)
- Justdial: headful preferred (blocks headless)
- Website search default: Bing via httpx/Playwright helper
- Enrichment: httpx AsyncClient, `verify=False` (SME certs), concurrency default 16,
  max ~6 pages/site, 2 MB response cap

## Known limitations (baseline)

- No SSRF / private-IP blocking on enrichment URLs
- CSV writes are direct overwrite (not atomic)
- No packaging (`pyproject.toml`), tests, or CI
- Package name `suratscraper` ≠ product name BizScrape
- Scraped sample data may exist at repo root (`surat_companies.csv`, `run_log.txt`)
- Exit codes mostly 0/1; weak CLI argument bounds checking
- Provider HTML selectors are fragile and may break without code changes

## Module map (pre-migration)

| Module | Role |
|--------|------|
| `main.py` | CLI + stage orchestration |
| `config.py` | Cities, niches, delays, CSV columns, query builder |
| `ui.py` | Wizard + Rich dashboard |
| `browser.py` | Playwright launch fallbacks |
| `gmaps.py` | Google Maps discovery |
| `justdial.py` | Justdial discovery |
| `websearch.py` | Missing website lookup |
| `enrich.py` | Site email/social crawl |
| `geo.py` | Locality filter |
| `store.py` | CSV store + dedupe |
| `utils.py` | Phones, emails, URLs, text |
| `shutdown.py` | Hard Ctrl+C |

## Call graph (simplified)

```text
main.main()
  → Store(path)
  → stage_discover → MapsScraper / JustdialScraper → geo.filter → Store.upsert → flush
  → stage_websites → WebSearcher/GoogleSearcher → Store.set_website → flush
  → stage_enrich → SiteEnricher → Store.save_enrichment → flush
  → stage_export → Store.export_csv
```

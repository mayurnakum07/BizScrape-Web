# Architecture

BizScrape is a Python CLI that discovers businesses (primarily via Google Maps,
optionally Justdial), optionally finds missing websites, crawls those sites for
public emails/phones/social links, and writes an 18-column CSV.

## High-level flow

```text
CLI (cli.py)
   ↓
pipeline stages (pipeline.py)
   ↓
sources/gmaps.py  sources/justdial.py
   ↓
geo filter + Store upsert/dedupe
   ↓
search/websearch.py  (missing websites)
   ↓
enrichment/site.py   (emails / social)
   ↓
store.export_csv     (atomic write)
```

## Module ownership

| Module | Owns |
|--------|------|
| `cli.py` | argparse, validation, exit codes, wizard trigger |
| `pipeline.py` | stage orchestration, target ingestion |
| `config.py` | static defaults (cities, niches, delays, CSV columns) |
| `models.py` | typed `BusinessRecord` |
| `store.py` | in-memory rows, dedupe keys, merge, CSV I/O |
| `geo.py` | locality matching / rejection |
| `utils.py` | phones, emails, URL helpers |
| `security.py` | fetch URL / host safety checks |
| `browser.py` | Playwright launch fallbacks |
| `shutdown.py` | Ctrl+C hard stop + CSV flush |
| `sources/*` | provider-specific HTML/API scraping |
| `search/*` | website lookup engines |
| `enrichment/*` | company-site crawl |

## Design rules

1. Do not put Google Maps / Justdial selectors in CLI, store, or enrichment.
2. Prefer small adapters over a heavy plugin framework.
3. Keep the public CSV schema stable unless versioned deliberately.
4. Default tests must not hit live external providers.
5. Partial failures (one bad site / one query) must not wipe successful rows.

## Browser lifecycle

Playwright browsers are launched through `browser.launch_browser` (Chrome →
Edge → Chromium). Discovery stages use async context managers so browsers close
on success or failure. Ctrl+C uses `shutdown` to flush CSV and kill the browser
process tree (especially important on Windows).

# BizScrape

**BizScrape** is a Python CLI that discovers businesses in Indian cities
(Google Maps, optional Justdial), finds missing websites, crawls those sites
for **publicly published** emails / phones / social links, and writes one CSV.

It is a terminal tool — not a web app, CRM, or email sender.

## Features

- Interactive wizard (`bizscrape run`) and non-interactive flags for automation
- Google Maps discovery + optional Justdial
- Locality filtering, deduplication, and hard target caps
- Website lookup + enrichment with SSRF-oriented URL checks
- Atomic CSV writes, UTF-8 BOM for Excel, Ctrl+C flush
- Offline test suite and GitHub Actions CI

## Supported Python

**3.10+** (tested in CI on 3.10 and 3.13)

## Install

```bash
git clone <repository-url>
cd bizscrape
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

python -m pip install -U pip
python -m pip install -e .
python -m playwright install chromium
```

You should also have **Google Chrome** or **Microsoft Edge** installed
(preferred by the browser launcher).

> PyPI install is not claimed until a real package release is published.

## Quick start

Interactive:

```bash
bizscrape run
```

Non-interactive:

```bash
bizscrape run \
  --city surat \
  --niche it \
  --areas "Mota Varachha" \
  --target 50 \
  --source gmaps \
  --yes
```

Preview Maps queries without scraping:

```bash
bizscrape discover --city surat --niche cafe --source gmaps --target 20 --dry-run --yes
```

Also supported: `python -m bizscrape …` and `python main.py …`.

## Commands

| Command | Purpose |
|---------|---------|
| `run` | Full pipeline (wizard unless `--yes` / explicit flags) |
| `discover` | Maps / Justdial only |
| `websites` | Fill missing websites |
| `enrich` | Crawl sites for public emails |
| `export` | Rewrite CSV (`--require email\|phone\|…`) |
| `stats` | Print counts |

See `bizscrape --help` and `bizscrape <command> --help`.

## Output

Default path:

```text
data/<city>_<niche>_YYYY-MM-DD.csv
```

Override with `--out` / `--output` (or legacy `--db`).

Sample (synthetic) CSV: [docs/example-output.csv](docs/example-output.csv).

Schema details: [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

## Configuration

Normal settings are CLI flags (city, niche, areas, target, sources, concurrency,
output path). Static defaults (built-in cities/niches, delays, crawl limits) live
in `src/bizscrape/config.py`. You should not need to edit Python for routine runs.

## Responsible use

- Collect only what you need; output stays local by default.
- Public listing pages and public website contact details are **not** the same
  as a license to spam, resell, or ignore provider terms or local law.
- BizScrape does **not** send email, SMS, WhatsApp, or submit contact forms.
- BizScrape does **not** bypass CAPTCHAs, logins, or paywalls.
- Emails are extracted as published text — **not** verified deliverable addresses.
- Prefer modest `--target` values and built-in delays; do not hammer providers.
- Operators are responsible for complying with website terms, robots rules,
  privacy law, and anti-spam rules in their jurisdiction.

## Limitations

- Provider HTML changes can break scrapers without warning
- Justdial often blocks automation; Maps-only mode is more reliable
- Website matching and email extraction are best-effort heuristics
- Enrichment disables TLS verification for broken SME certificates (see SECURITY.md)
- Result counts are not guaranteed

## Development

```bash
python -m pip install -e ".[dev]"
pytest
ruff check src tests
ruff format src tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Sources](docs/SOURCES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE)

The software license does **not** grant permission to ignore third-party
provider terms or applicable law.

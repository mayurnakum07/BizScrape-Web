# BizScrape

**Discover local businesses from Google Maps, find their websites, extract public contact details, and export a clean CSV — from your terminal.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![CI](https://github.com/mayurnakum07/BizScrape/actions/workflows/ci.yml/badge.svg)](https://github.com/mayurnakum07/BizScrape/actions/workflows/ci.yml)

BizScrape is a **Python CLI** (not a web app). You pick a niche, city, and target count — it scrapes **Google Maps**, looks up missing websites, crawls those sites for **publicly published** emails / phones / social links, and writes one Excel-friendly CSV.

---

## Features

- Interactive wizard (`run`) and fully non-interactive flags for scripts
- Google Maps discovery with locality filtering and deduplication
- Website lookup (Bing by default) + site enrichment for public emails
- Hard target caps, periodic CSV flush, Ctrl+C safe shutdown
- UTF-8 BOM CSV (opens cleanly in Excel)
- Offline test suite + GitHub Actions CI

---

## Requirements

| Need | Notes |
|------|--------|
| **Python 3.10+** | [Download Python](https://www.python.org/downloads/) — on Windows, enable **Add python.exe to PATH** |
| **Chrome or Edge** | Recommended (Playwright can also use Chromium) |
| **Internet** | Required for Maps / search / enrichment |

---

## Quick start

```bash
git clone https://github.com/mayurnakum07/BizScrape.git
cd BizScrape

python -m venv .venv
```

**Activate the virtual environment**

```bash
# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

**Install**

```bash
python -m pip install -U pip
python -m pip install -e .
python -m playwright install chromium
```

**Run (interactive wizard)**

```bash
python -m bizscrape run
```

That is the most reliable command on Windows. After the venv is activated you can also use:

```bash
bizscrape run
# or
python main.py run
```

The wizard asks for business type, city, area, and target count, then runs the full pipeline into `data/`.

---

## Usage examples

**Non-interactive full run**

```bash
python -m bizscrape run \
  --city surat \
  --niche it \
  --areas "Mota Varachha" \
  --target 50 \
  --yes
```

**Discover only (Google Maps)**

```bash
python -m bizscrape discover --city mumbai --niche food --target 20 --yes
```

**Preview Maps queries without scraping**

```bash
python -m bizscrape discover --city surat --niche cafe --target 20 --dry-run --yes
```

**Enrich existing CSV / show stats**

```bash
python -m bizscrape enrich --concurrency 8
python -m bizscrape stats --out data/surat_it_2026-09-15.csv
```

---

## Commands

| Command | Description |
|---------|-------------|
| `run` | Full pipeline (wizard unless `--yes` or explicit flags) |
| `discover` | Google Maps discovery only |
| `websites` | Fill missing websites |
| `enrich` | Crawl company sites for public emails |
| `export` | Rewrite CSV (`--require email\|phone\|…`) |
| `stats` | Print counts for a CSV |
| `--help` / `--version` | Help and version |

```bash
python -m bizscrape --help
python -m bizscrape run --help
```

---

## How it works

```text
You (niche + city + target)
        ↓
  Google Maps discovery
        ↓
  Locality filter + dedupe + target cap
        ↓
  Missing website lookup (Bing / DDG / Google)
        ↓
  Website enrichment (public emails, phones, social)
        ↓
  CSV export → data/<city>_<niche>_YYYY-MM-DD.csv
```

---

## Output

Default file:

```text
data/<city>_<niche>_YYYY-MM-DD.csv
```

Override with `--out path/to/file.csv`.

Columns include company name, website, emails, phones, address, area, rating, social links, Maps URL, and timestamps.

Synthetic sample: [`docs/example-output.csv`](docs/example-output.csv)  
Schema details: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python` not found | Install Python 3.10+, reopen the terminal, confirm `python --version` |
| `bizscrape` is not recognized | Use `python -m bizscrape …`, or activate `.venv` then reinstall with `pip install -e .` |
| `No usable browser found` | Install Chrome/Edge, or run `python -m playwright install chromium` |
| `ModuleNotFoundError: bizscrape` | From the repo root: `python -m pip install -e .` |
| Permission denied writing CSV | Close the file in Excel and retry |

More help: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

---

## Responsible use

BizScrape collects **public** listing and website contact details for personal/research workflows.

- It does **not** send email, SMS, WhatsApp, or submit contact forms
- It does **not** bypass CAPTCHAs, logins, or paywalls
- Extracted emails are **not** verified as deliverable
- “Public data” does **not** mean free to spam, resell, or ignore provider terms
- You are responsible for complying with Google’s terms, website policies, privacy law, and anti-spam rules in your jurisdiction

Prefer modest `--target` values. Be a good citizen of the public web.

---

## Limitations

- Google Maps UI changes can break selectors without notice
- Website matching and email extraction are best-effort heuristics
- Result counts are **not** guaranteed
- Enrichment may skip sites with broken TLS / heavy JavaScript
- Built for local CSV output — not a CRM, dashboard, or outreach tool

---

## Development

```bash
python -m pip install -e ".[dev]"
pytest
ruff check src tests
ruff format src tests
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module layout and pipeline |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | CSV schema and merge rules |
| [`docs/SOURCES.md`](docs/SOURCES.md) | Provider notes and crawl policy |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common failures |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |

---

## License

[MIT](LICENSE) © BizScrape contributors

The software license does **not** grant permission to ignore third-party terms or applicable law.

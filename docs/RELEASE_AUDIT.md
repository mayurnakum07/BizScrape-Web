# Final release audit (Definition of Done)

Date: 2026-09-15 · Version target: **0.1.0**

## Installation

| Requirement | Status |
|-------------|--------|
| `pip install -e .` | Pass |
| `python -m bizscrape --help` / `--version` | Pass (`bizscrape 0.1.0`) |
| `bizscrape` console script | Installed (may need Scripts on PATH) |
| `python main.py` shim | Pass |
| Python range documented (3.10+) | Pass |

## Functional preservation

| Behavior | Status |
|----------|--------|
| Interactive CLI wizard | Preserved |
| Non-interactive `--yes` | Preserved |
| Google Maps / websites / enrich | Preserved (Justdial removed) |
| Locality filtering / dedupe / target / CSV / Ctrl+C | Preserved |
| 18-column CSV schema | Unchanged |

## Safety / reliability

| Requirement | Status |
|-------------|--------|
| SSRF host/IP checks + redirect re-check | Implemented (`security.py`) |
| Path/slug sanitization | Implemented |
| Target bounds + exit code 2 | Implemented |
| Atomic CSV write | Implemented |
| Enrichment retries (transient) | Implemented |
| No CAPTCHA bypass / outreach / telemetry | Confirmed absent |

## Testing / quality

| Requirement | Status |
|-------------|--------|
| Offline pytest | **28 passed** |
| Fixtures for HTML harvest | Present |
| Ruff lint + format | Clean |
| CI workflow (3.10 + 3.13) | `.github/workflows/ci.yml` |
| mypy in CI | Present (`continue-on-error`) |

## Docs / legal

| File | Status |
|------|--------|
| README (product) | Rewritten |
| LICENSE (MIT) | Present |
| CONTRIBUTING / SECURITY / CODE_OF_CONDUCT / CHANGELOG | Present |
| docs/* architecture set | Present |
| Synthetic example CSV | `docs/example-output.csv` |
| `.gitignore` excludes data CSVs / logs / secrets | Present |

## Deferred / residual risks

1. DNS rebinding after SSRF check (documented)
2. `verify=False` on enrichment TLS (compatibility trade-off)
3. No full robots.txt engine
4. No PyPI publish / release.yml automation
5. Provider selector fragility (inherent)
6. Local files `surat_companies.csv` / `run_log.txt` may still exist on disk — **must not** be committed
7. GitHub remote / first public push is a manual maintainer step
8. Homepage URLs in `pyproject.toml` still use `example` placeholders — update when the real repo URL is known
9. Residual `suratscraper` shim package kept for compatibility (deprecated)

## Recommended GitHub release checklist

1. Confirm `.gitignore` excludes `*.csv` (except `docs/example-output.csv`), logs, `.env`
2. `git init` (if needed) and verify `git status` shows **no** real contact CSVs
3. Set real repository URLs in `pyproject.toml` `[project.urls]`
4. Create GitHub repo named **BizScrape** (or `bizscrape`)
5. Push `main` with only source, tests, docs — no PII history
6. Add description + topics: `python`, `cli`, `csv`, `web-scraping`, `google-maps`, `osint` (use carefully), `india`
7. Tag `v0.1.0` and create a GitHub Release from CHANGELOG
8. Enable GitHub Actions; confirm CI green
9. Enable private vulnerability reporting
10. Pin maintainer security contact in SECURITY.md if not using GH advisories alone

# Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `No usable browser found` | Playwright Chromium missing / no Chrome/Edge | Install Chrome or Edge, or `python -m playwright install chromium` |
| Zero companies after run | Queries too narrow, filters rejecting, provider empty | Try `--dry-run`, broader niche, city-wide areas, check network |
| Excel garbled text | Opened with wrong encoding | File is UTF-8 BOM; open via Excel’s UTF-8 CSV import |
| `Permission denied writing CSV` | File open in Excel | Close the CSV and retry |
| `target must be between…` | Invalid `--target` | Use 1–5000 |
| Enrichment `blocked:` notes | SSRF guard rejected URL | Expected for localhost/private IPs |
| Hang on Ctrl+C | Rare signal race | Second Ctrl+C; `shutdown` should kill browser tree |
| `suratscraper` import warning | Deprecated package name | `import bizscrape` / `pip install -e .` |
| `bizscrape` / `python` not found after clone | venv not activated or package not installed | `cd BizScrape` → activate `.venv` → `pip install -e .` |
| `ModuleNotFoundError: bizscrape` | Editable install missing | From repo root: `python -m pip install -e .` |

## Logging

Use the Rich dashboard during interactive `run`. For quieter output, `--quiet`.
Unexpected exceptions print a traceback when verbose (default).

## Still stuck?

Open a bug report with the exact command (synthetic data only), OS, Python
version, and `bizscrape --version`.

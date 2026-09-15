# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

## [0.1.0] - 2026-09-15

### Added

- Packaged CLI as `bizscrape` (`pip install -e .`, `python -m bizscrape`, `bizscrape`)
- Typed `BusinessRecord` model and explicit pipeline module
- Source isolation under `sources/`, `search/`, and `enrichment/`
- SSRF-oriented URL checks for website enrichment
- Atomic CSV writes (temp + replace)
- Offline pytest suite, Ruff config, GitHub Actions CI
- Open-source docs: LICENSE (MIT), CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, architecture docs
- `--dry-run` query preview, `--version`, target/source validation, exit code 2 for usage errors
- Compatibility shims for legacy `suratscraper` imports and root `main.py`

### Changed

- Package identity renamed from `suratscraper` to `bizscrape` (product name remains BizScrape)
- Phone normalization strips leading zeros before country-code handling

### Security

- Block enrichment fetches to localhost / private / link-local addresses
- Sanitize output filename components to reduce path traversal risk

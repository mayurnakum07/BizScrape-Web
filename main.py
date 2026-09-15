#!/usr/bin/env python
"""Backward-compatible entry: ``python main.py …`` → ``bizscrape`` CLI."""

from __future__ import annotations

from bizscrape.cli import main

if __name__ == "__main__":
    raise SystemExit(main())

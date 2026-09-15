#!/usr/bin/env python
"""
BizScrape CLI entry for a cloned checkout.

After install (see README), run:

    python main.py run
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow ``python main.py`` right after ``pip install -e .`` or when ``src/``
# is present but the package is not on PYTHONPATH yet.
_SRC = Path(__file__).resolve().parent / "src"
if _SRC.is_dir() and str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from bizscrape.cli import main

if __name__ == "__main__":
    raise SystemExit(main())

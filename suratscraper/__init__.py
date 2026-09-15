"""Deprecated package name — use ``bizscrape`` instead.

This shim keeps older ``import suratscraper`` call sites working when both
packages are on ``PYTHONPATH``. Prefer installing BizScrape via::

    pip install -e .
"""

from __future__ import annotations

import sys
import warnings

warnings.warn(
    "The 'suratscraper' package name is deprecated; import 'bizscrape' instead.",
    DeprecationWarning,
    stacklevel=2,
)

try:
    from bizscrape import __version__
except ImportError:
    # Editable install not active — put src/ on path for local checkout.
    from pathlib import Path

    src = Path(__file__).resolve().parent.parent / "src"
    if src.is_dir() and str(src) not in sys.path:
        sys.path.insert(0, str(src))
    from bizscrape import __version__

__all__ = ["__version__"]

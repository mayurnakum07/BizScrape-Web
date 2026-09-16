"""CSV formula-injection protection for server-side exports."""

from __future__ import annotations

import re

_DANGEROUS_PREFIX = re.compile(r"^[=+\-@\t\r]")


def neutralize_csv_formula(value: str) -> str:
    """
    Prefix spreadsheet-formula triggers with a single quote.

    Matches the frontend policy in ``services/export/csv/formula.ts``.
    """
    if not value:
        return value
    if _DANGEROUS_PREFIX.match(value):
        return f"'{value}"
    return value


def neutralize_csv_row(row: dict[str, str]) -> dict[str, str]:
    return {key: neutralize_csv_formula(str(value or "")) for key, value in row.items()}

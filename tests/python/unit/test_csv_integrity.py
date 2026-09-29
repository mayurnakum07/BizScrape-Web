"""CSV integrity tests using a real CSV parser."""

from __future__ import annotations

import csv
from pathlib import Path

from bizscrape.config import CSV_COLUMNS
from bizscrape.csv_safety import neutralize_csv_formula
from bizscrape.store import Store


def test_export_has_bom_unicode_formula_safety_and_valid_csv(tmp_path: Path) -> None:
    csv_path = tmp_path / "export.csv"
    store = Store(str(csv_path))
    store.upsert(
        {
            "name": "=cmd|'/c calc'!A0",
            "emails": ["info@cafe.example"],
            "phones": ["+19811122233"],
            "website": "https://cafe.example",
            "address": "New York - Café ☕",
            "area": "Brooklyn",
            "category": "Cafe",
            "source": "gmaps",
        }
    )
    store.export_csv(str(csv_path))

    raw = csv_path.read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf")

    text = raw.decode("utf-8-sig")
    rows = list(csv.reader(text.splitlines()))
    assert rows[0] == CSV_COLUMNS
    assert len(rows) == 2

    company_cell = rows[1][0]
    assert company_cell.startswith("'=")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        dict_rows = list(csv.DictReader(handle))
    assert dict_rows[0]["company_name"].startswith("'=")
    assert "☕" in dict_rows[0]["address"]


def test_neutralize_matches_store_export_policy() -> None:
    assert neutralize_csv_formula("+19999") == "'+19999"

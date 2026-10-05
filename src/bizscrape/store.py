"""
CSV-backed company store (no SQLite).

All progress lives in one CSV. The file is rewritten after each batch so
Ctrl+C never loses more than the current page of results. Writes use a
temp file + os.replace for atomicity where the OS supports it.
"""

from __future__ import annotations

import csv
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import config, utils
from .csv_safety import neutralize_csv_row
from .errors import StorageError


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _split_multi(value: str) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(";") if part.strip()]


def _join_multi(values: list[str]) -> str:
    return "; ".join(dict.fromkeys(v for v in values if v))


class Store:
    """In-memory company list with CSV persistence and deduplication."""

    def __init__(self, path: str = ""):
        self.path = path or config.output_csv_path(config.DEFAULT_CITY, config.DEFAULT_NICHE)
        directory = os.path.dirname(os.path.abspath(self.path))
        if directory:
            os.makedirs(directory, exist_ok=True)

        self._rows: list[dict[str, Any]] = []
        self._by_id: dict[int, dict[str, Any]] = {}
        self._dedupe: dict[str, int] = {}
        self._done_queries: set[str] = set()
        self._next_id = 1
        self._dirty = False

        if os.path.exists(self.path):
            self._load_csv()

    # --- lifecycle -----------------------------------------------------------

    def close(self) -> None:
        self.flush()

    def __enter__(self) -> Store:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def flush(self) -> None:
        if not self._dirty and os.path.exists(self.path):
            return
        self.export_csv(self.path, require="any")
        self._dirty = False

    def _load_csv(self) -> None:
        path = Path(self.path)
        try:
            if path.stat().st_size == 0:
                return
        except OSError as exc:
            raise StorageError(f"Cannot read CSV {self.path}: {exc}") from exc

        try:
            with open(self.path, newline="", encoding="utf-8-sig") as handle:
                reader = csv.DictReader(handle)
                if reader.fieldnames is None:
                    return
                # Tolerate unknown extra columns; require at least company_name.
                if "company_name" not in reader.fieldnames and "name" not in reader.fieldnames:
                    raise StorageError(
                        f"CSV appears corrupt or incompatible (missing company_name): {self.path}"
                    )
                for raw in reader:
                    row = self._from_csv_row(raw)
                    self._rows.append(row)
                    self._by_id[row["id"]] = row
                    for key in self._keys_for(row):
                        self._dedupe.setdefault(key, row["id"])
                    self._next_id = max(self._next_id, row["id"] + 1)
        except StorageError:
            raise
        except csv.Error as exc:
            raise StorageError(f"Corrupt CSV {self.path}: {exc}") from exc
        except OSError as exc:
            raise StorageError(f"Cannot read CSV {self.path}: {exc}") from exc

    def _from_csv_row(self, raw: dict[str, str]) -> dict[str, Any]:
        row_id = self._next_id
        self._next_id += 1
        return {
            "id": row_id,
            "name": raw.get("company_name") or "",
            "website": raw.get("website") or "",
            "address": raw.get("address") or "",
            "area": raw.get("area") or "",
            "category": raw.get("category") or "",
            "rating": _float_or_none(raw.get("rating")),
            "review_count": _int_or_none(raw.get("review_count")),
            "maps_url": raw.get("maps_url") or "",
            "emails": _split_multi(raw.get("emails_all") or raw.get("email_primary") or ""),
            "phones": _split_multi(raw.get("phones_all") or raw.get("phone_primary") or ""),
            "linkedin": raw.get("linkedin") or "",
            "facebook": raw.get("facebook") or "",
            "instagram": raw.get("instagram") or "",
            "sources": raw.get("sources") or "",
            "enrich_status": _infer_enrich_status(raw),
            "enrich_note": "",
            "first_seen": raw.get("first_seen") or _now(),
            "last_enriched": raw.get("last_enriched") or "",
        }

    # --- dedupe --------------------------------------------------------------

    @staticmethod
    def _keys_for(record: dict) -> list[str]:
        keys: list[str] = []
        feature_id = utils.maps_feature_id(record.get("maps_url", ""))
        if feature_id:
            keys.append("g:" + feature_id)

        website = record.get("website") or ""
        if website and utils.is_company_website(website):
            domain = utils.registrable_domain(website)
            if domain:
                keys.append("d:" + domain)

        for phone in record.get("phones") or []:
            keys.append("p:" + phone)

        slug = utils.slugify_name(record.get("name", ""))
        if len(slug) >= 4:
            area_tag = utils.slugify_name(record.get("area") or "")
            if area_tag:
                keys.append(f"n:{slug}:{area_tag}")
            else:
                keys.append("n:" + slug)
        return keys

    def _lookup(self, keys: list[str]) -> int | None:
        for key in keys:
            if key in self._dedupe:
                return self._dedupe[key]
        return None

    def _bind_keys(self, company_id: int, keys: list[str]) -> None:
        for key in keys:
            self._dedupe.setdefault(key, company_id)

    # --- write path ----------------------------------------------------------

    def upsert(self, record: dict) -> str:
        keys = self._keys_for(record)
        existing_id = self._lookup(keys)

        if existing_id is None:
            row = {
                "id": self._next_id,
                "name": record.get("name") or "",
                "website": record.get("website") or "",
                "address": record.get("address") or "",
                "area": record.get("area") or "",
                "category": record.get("category") or "",
                "rating": record.get("rating"),
                "review_count": record.get("review_count"),
                "maps_url": record.get("maps_url") or "",
                "emails": list(record.get("emails") or []),
                "phones": list(record.get("phones") or []),
                "linkedin": record.get("linkedin") or "",
                "facebook": record.get("facebook") or "",
                "instagram": record.get("instagram") or "",
                "sources": record.get("source") or "",
                "enrich_status": "pending" if record.get("website") else "no_website",
                "enrich_note": "",
                "first_seen": _now(),
                "last_enriched": "",
            }
            self._next_id += 1
            self._rows.append(row)
            self._by_id[row["id"]] = row
            self._bind_keys(row["id"], keys)
            self._dirty = True
            return "new"

        self._merge(existing_id, record)
        self._bind_keys(existing_id, keys)
        self._dirty = True
        return "updated"

    def _merge(self, company_id: int, record: dict) -> None:
        """
        Field-level merge: prefer non-empty, longer address, union multi-values.
        Never resets first_seen.
        """
        row = self._by_id[company_id]

        incoming_site = record.get("website") or ""
        if incoming_site and utils.is_company_website(incoming_site):
            if not row["website"] or not utils.is_company_website(row["website"]):
                row["website"] = incoming_site
                row["enrich_status"] = "pending"

        incoming_address = record.get("address") or ""
        if len(incoming_address) > len(row.get("address") or ""):
            row["address"] = incoming_address

        for field in ("area", "category", "maps_url", "linkedin", "facebook", "instagram"):
            if not row.get(field) and record.get(field):
                row[field] = record[field]

        if row.get("rating") is None and record.get("rating") is not None:
            row["rating"] = record["rating"]
        if row.get("review_count") is None and record.get("review_count") is not None:
            row["review_count"] = record["review_count"]

        row["phones"] = _union(row.get("phones") or [], record.get("phones") or [])
        row["emails"] = _union(row.get("emails") or [], record.get("emails") or [])

        sources = _union(
            [s for s in (row.get("sources") or "").split(",") if s],
            [record["source"]] if record.get("source") else [],
        )
        row["sources"] = ",".join(sources)

    def set_website(self, company_id: int, website: str) -> None:
        row = self._by_id.get(company_id)
        if not row:
            return
        row["website"] = website
        row["enrich_status"] = "pending"
        domain = utils.registrable_domain(website)
        if domain:
            self._bind_keys(company_id, ["d:" + domain])
        self._dirty = True

    def save_enrichment(self, company_id: int, result: dict) -> None:
        row = self._by_id.get(company_id)
        if not row:
            return
        row["emails"] = _union(row.get("emails") or [], result.get("emails") or [])
        row["phones"] = _union(row.get("phones") or [], result.get("phones") or [])
        row["linkedin"] = result.get("linkedin") or row.get("linkedin") or ""
        row["facebook"] = result.get("facebook") or row.get("facebook") or ""
        row["instagram"] = result.get("instagram") or row.get("instagram") or ""
        row["enrich_status"] = result.get("status") or "done"
        row["enrich_note"] = result.get("note") or ""
        row["last_enriched"] = _now()
        self._dirty = True

    # --- queries / reads -----------------------------------------------------

    def count(self) -> int:
        return len(self._rows)

    def is_query_done(self, query: str, source: str) -> bool:
        return f"{source}::{query}" in self._done_queries

    def mark_query_done(self, query: str, source: str, found: int = 0) -> None:
        self._done_queries.add(f"{source}::{query}")

    def missing_website(self, limit: int | None = None) -> list[dict]:
        rows = [
            {"id": r["id"], "name": r["name"], "area": r.get("area") or ""}
            for r in self._rows
            if not (r.get("website") or "").strip()
        ]
        return rows[:limit] if limit else rows

    def pending_enrichment(
        self, limit: int | None = None, retry_failed: bool = False
    ) -> list[dict]:
        rows: list[dict] = []
        for r in self._rows:
            website = (r.get("website") or "").strip()
            if not website:
                continue
            status = r.get("enrich_status") or "pending"
            if status in ("pending", "no_website", ""):
                rows.append({"id": r["id"], "name": r["name"], "website": website})
            elif retry_failed and status == "failed":
                rows.append({"id": r["id"], "name": r["name"], "website": website})
        return rows[:limit] if limit else rows

    def stats(self) -> dict[str, int]:
        total = len(self._rows)
        with_website = sum(1 for r in self._rows if r.get("website"))
        with_phone = sum(1 for r in self._rows if r.get("phones"))
        with_email = sum(1 for r in self._rows if r.get("emails"))
        pending = len(self.pending_enrichment())
        return {
            "total": total,
            "with_website": with_website,
            "with_phone": with_phone,
            "with_email": with_email,
            "pending_enrichment": pending,
        }

    def export_csv(self, path: str = "", require: str = "any") -> int:
        path = path or self.path
        directory = os.path.dirname(os.path.abspath(path))
        if directory:
            try:
                os.makedirs(directory, exist_ok=True)
            except OSError as exc:
                raise StorageError(f"Cannot create output directory {directory}: {exc}") from exc

        rows_out: list[dict[str, Any]] = []
        for row in self._rows:
            emails = list(row.get("emails") or [])
            phones = list(row.get("phones") or [])
            if require == "email" and not emails:
                continue
            if require == "phone" and not phones:
                continue
            if require == "contact" and not (emails or phones):
                continue
            if require == "both" and not (emails and phones):
                continue

            primary_email = utils.pick_primary_email(emails, row.get("website") or "")
            primary_phone = phones[0] if phones else ""
            rows_out.append(
                {
                    "company_name": row.get("name") or "",
                    "website": row.get("website") or "",
                    "email_primary": primary_email,
                    "emails_all": _join_multi(emails),
                    "phone_primary": primary_phone,
                    "phones_all": _join_multi(phones),
                    "address": row.get("address") or "",
                    "area": row.get("area") or "",
                    "category": row.get("category") or "",
                    "rating": row.get("rating") if row.get("rating") is not None else "",
                    "review_count": (
                        row.get("review_count") if row.get("review_count") is not None else ""
                    ),
                    "linkedin": row.get("linkedin") or "",
                    "facebook": row.get("facebook") or "",
                    "instagram": row.get("instagram") or "",
                    "sources": row.get("sources") or "",
                    "maps_url": row.get("maps_url") or "",
                    "first_seen": row.get("first_seen") or "",
                    "last_enriched": row.get("last_enriched") or "",
                }
            )

        try:
            _atomic_write_csv(path, rows_out)
        except PermissionError as exc:
            raise StorageError(
                f"Permission denied writing {path}. Close the file if it is open in Excel."
            ) from exc
        except OSError as exc:
            err = getattr(exc, "errno", None)
            if err in {28, 112}:  # ENOSPC / ERROR_DISK_FULL-ish
                raise StorageError(f"Disk full while writing {path}") from exc
            raise StorageError(f"Failed to write CSV {path}: {exc}") from exc

        self.path = path
        return len(rows_out)


def _atomic_write_csv(path: str, rows: list[dict[str, Any]]) -> None:
    """Write CSV via temp file + fsync + os.replace."""
    directory = os.path.dirname(os.path.abspath(path)) or "."
    fd, tmp_name = tempfile.mkstemp(prefix=".bizscrape_", suffix=".csv", dir=directory)
    try:
        with os.fdopen(fd, "w", newline="", encoding="utf-8-sig") as handle:
            writer = csv.DictWriter(handle, fieldnames=config.CSV_COLUMNS)
            writer.writeheader()
            for row in rows:
                writer.writerow(neutralize_csv_row(row))
            handle.flush()
            try:
                os.fsync(handle.fileno())
            except OSError:
                pass
        os.replace(tmp_name, path)
    except Exception:
        try:
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)
        except OSError:
            pass
        raise


def _union(left: list[str], right: list[str]) -> list[str]:
    return list(dict.fromkeys([*left, *right]))


def _float_or_none(value: object) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _int_or_none(value: object) -> int | None:
    try:
        if value is None or value == "":
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _infer_enrich_status(raw: dict[str, str]) -> str:
    if raw.get("emails_all") or raw.get("email_primary"):
        return "done"
    if raw.get("website"):
        return "pending"
    return "no_website"

# CSV export

Frontend export path (Milestone 07):

```text
ScrapeResultsSnapshot.records (complete set)
   ↓
generateCsv()
   ↓
UTF-8 BOM + 18-column CSV string
   ↓
Blob download
```

## Schema

Authoritative columns live in `services/export/csv/schema.ts` (`CSV_COLUMNS`).

## Rules

- Deterministic column order (not object key order)
- UTF-8 with BOM for Excel
- Multi-value fields remain `;`-separated strings
- RFC 4180 quoting for commas, quotes, and newlines
- Formula-injection neutralization for cells starting with `= + - @` / tab / CR (frontend **and** Python `store.export_csv`)
- Export uses the **complete** job result set (UI filters do not affect the file)

## Future backend

`generateCsv` / `downloadCsv` stay transport-agnostic so a later Python-produced file URL can replace the Blob step without changing the results-page API.

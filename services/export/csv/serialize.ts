import { neutralizeCsvFormula } from "@/services/export/csv/formula";
import {
  CSV_COLUMNS,
  CSV_UTF8_BOM,
  type CsvColumn,
} from "@/services/export/csv/schema";
import type { BusinessRecord } from "@/types/business-record";

/**
 * RFC 4180-style CSV field escaping.
 * Quotes fields that contain comma, quote, CR, or LF.
 * Doubles embedded quotes.
 */
export function escapeCsvField(raw: string): string {
  const value = neutralizeCsvFormula(raw);
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function recordToCsvRow(record: BusinessRecord): string {
  return CSV_COLUMNS.map((column) =>
    escapeCsvField(getCsvCell(record, column)),
  ).join(",");
}

export function getCsvCell(record: BusinessRecord, column: CsvColumn): string {
  const value = record[column];
  return typeof value === "string" ? value : "";
}

/**
 * Serialize records to a CSV string with header + UTF-8 BOM.
 * Does not include the BOM when `withBom` is false (useful for assertions).
 */
export function serializeRecordsToCsv(
  records: BusinessRecord[],
  options?: { withBom?: boolean },
): string {
  const withBom = options?.withBom ?? true;
  const header = CSV_COLUMNS.join(",");
  const lines = [header, ...records.map(recordToCsvRow)];
  const body = `${lines.join("\r\n")}\r\n`;
  return withBom ? `${CSV_UTF8_BOM}${body}` : body;
}

export type CsvInspection = {
  hasBom: boolean;
  header: string[];
  rowCount: number;
  rows: string[][];
};

/** Development/test helper to inspect generated CSV text. */
export function inspectCsv(csv: string): CsvInspection {
  const hasBom = csv.startsWith(CSV_UTF8_BOM);
  const text = hasBom ? csv.slice(CSV_UTF8_BOM.length) : csv;
  const parsed = parseCsvDocument(text);
  const header = parsed[0] ?? [];
  const rows = parsed.slice(1);

  return {
    hasBom,
    header,
    rowCount: rows.length,
    rows,
  };
}

function parseCsvDocument(text: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      fields.push(current);
      current = "";
      continue;
    }

    if (char === "\r" && next === "\n") {
      fields.push(current);
      rows.push(fields);
      fields = [];
      current = "";
      i += 1;
      continue;
    }

    if (char === "\n" || char === "\r") {
      fields.push(current);
      rows.push(fields);
      fields = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || fields.length > 0) {
    fields.push(current);
    rows.push(fields);
  }

  // Drop trailing empty row produced by a final newline.
  if (
    rows.length > 0 &&
    rows[rows.length - 1]?.length === 1 &&
    rows[rows.length - 1]?.[0] === ""
  ) {
    rows.pop();
  }

  return rows;
}

/**
 * Filename helpers for BizScrape CSV downloads.
 * Pattern: <city>_<niche>_<YYYY-MM-DD>.csv
 */

export type CsvFilenameParts = {
  city: string;
  niche: string;
  date?: Date;
};

/**
 * Sanitize a human label into a filename-safe slug.
 * Keeps Unicode letters/numbers when possible; collapses separators.
 */
export function sanitizeFilenamePart(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "unknown";
  }

  // Normalize accents where possible (é → e) while keeping scripts like Gujarati.
  const normalized = trimmed.normalize("NFKD").replace(/\p{M}/gu, "");

  const slug = normalized
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "unknown";
}

export function formatCsvDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildCsvFilename(parts: CsvFilenameParts): string {
  const city = sanitizeFilenamePart(parts.city);
  const niche = sanitizeFilenamePart(parts.niche);
  const date = formatCsvDate(parts.date ?? new Date());
  return `${city}_${niche}_${date}.csv`;
}

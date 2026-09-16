/**
 * Authoritative BizScrape CSV column schema (18 fields).
 * Used for header generation, row mapping, and schema tests.
 */

export const CSV_COLUMNS = [
  "company_name",
  "website",
  "email_primary",
  "emails_all",
  "phone_primary",
  "phones_all",
  "address",
  "area",
  "category",
  "rating",
  "review_count",
  "linkedin",
  "facebook",
  "instagram",
  "sources",
  "maps_url",
  "first_seen",
  "last_enriched",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export const CSV_COLUMN_COUNT = CSV_COLUMNS.length;

/** Multi-value field separator used by BizScrape CLI CSV output. */
export const CSV_MULTI_VALUE_SEPARATOR = ";";

/** UTF-8 BOM for Excel-friendly files. */
export const CSV_UTF8_BOM = "\uFEFF";

import {
  hasEmail,
  hasPhone,
  hasWebsite,
  type BusinessRecord,
} from "@/types/business-record";
import type {
  ResultsFilters,
  ResultsSortKey,
} from "@/components/results/results-toolbar";

const SEARCH_INDEX = new WeakMap<BusinessRecord, string>();

function searchableText(record: BusinessRecord): string {
  const existing = SEARCH_INDEX.get(record);
  if (existing) {
    return existing;
  }

  const value = [
    record.company_name,
    record.website,
    record.email_primary,
    record.emails_all,
    record.phone_primary,
    record.phones_all,
    record.address,
    record.area,
    record.category,
  ]
    .join(" ")
    .toLowerCase();

  SEARCH_INDEX.set(record, value);
  return value;
}

function compareSort(
  a: BusinessRecord,
  b: BusinessRecord,
  sort: ResultsSortKey,
): number {
  if (sort === "company_name") {
    return a.company_name.localeCompare(b.company_name, undefined, {
      sensitivity: "base",
    });
  }
  if (sort === "rating") {
    return (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0);
  }
  return (
    (Number.parseInt(b.review_count, 10) || 0) -
    (Number.parseInt(a.review_count, 10) || 0)
  );
}

export function filterAndSortRecords(
  records: BusinessRecord[],
  filters: ResultsFilters,
): BusinessRecord[] {
  const query = filters.query.trim().toLowerCase();
  const filtered: BusinessRecord[] = [];

  for (const record of records) {
    if (filters.area && record.area !== filters.area) {
      continue;
    }
    if (filters.category && record.category !== filters.category) {
      continue;
    }
    if (filters.hasWebsite && !hasWebsite(record)) {
      continue;
    }
    if (filters.hasEmail && !hasEmail(record)) {
      continue;
    }
    if (filters.hasPhone && !hasPhone(record)) {
      continue;
    }
    if (query && !searchableText(record).includes(query)) {
      continue;
    }

    filtered.push(record);
  }

  filtered.sort((a, b) => compareSort(a, b, filters.sort));
  return filtered;
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

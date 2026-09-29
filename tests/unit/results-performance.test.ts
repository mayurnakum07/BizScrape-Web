import { describe, expect, it } from "vitest";

import { filterAndSortRecords } from "@/components/results/filter-records";
import type { ResultsFilters } from "@/components/results/results-toolbar";
import { deriveResultSummary } from "@/types/scrape-results";
import type { BusinessRecord } from "@/types/business-record";

function makeRecord(index: number): BusinessRecord {
  return {
    id: `record-${index}`,
    company_name: index % 25 === 0 ? `Cafe ${index}` : `Business ${index}`,
    website: index % 2 === 0 ? `https://example-${index}.com` : "",
    email_primary: index % 3 === 0 ? `team${index}@example.com` : "",
    emails_all: "",
    phone_primary: index % 4 === 0 ? `+1 90000${String(index).padStart(5, "0")}` : "",
    phones_all: "",
    address: `Street ${index}`,
    area: index % 2 === 0 ? "Brooklyn" : "Queens",
    category: index % 5 === 0 ? "Cafe" : "Agency",
    rating: String(5 - (index % 5) * 0.5),
    review_count: String(index * 3),
    linkedin: "",
    facebook: "",
    instagram: "",
    sources: "gmaps",
    maps_url: "",
    first_seen: "2026-01-01T00:00:00Z",
    last_enriched: "2026-01-02T00:00:00Z",
  };
}

const baseFilters: ResultsFilters = {
  query: "",
  area: "",
  category: "",
  hasWebsite: false,
  hasEmail: false,
  hasPhone: false,
  sort: "company_name",
};

describe("results derived-data pipeline", () => {
  it("handles large record sets predictably", () => {
    const records = Array.from({ length: 1000 }, (_, index) => makeRecord(index + 1));

    const filtered = filterAndSortRecords(records, {
      ...baseFilters,
      query: "cafe",
      area: "Brooklyn",
      hasWebsite: true,
      sort: "review_count",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((record) => record.area === "Brooklyn")).toBe(true);
    expect(filtered.every((record) => record.website)).toBe(true);
    expect(Number(filtered[0]?.review_count ?? 0)).toBeGreaterThanOrEqual(
      Number(filtered.at(-1)?.review_count ?? 0),
    );
  });

  it("derives summary counts in one pass", () => {
    const records = [
      makeRecord(1),
      makeRecord(2),
      makeRecord(3),
      makeRecord(4),
      makeRecord(5),
      makeRecord(6),
    ];

    expect(deriveResultSummary(records, 7)).toEqual({
      businesses: 6,
      websites: 3,
      emails: 2,
      phones: 1,
      duplicates: 7,
    });
  });
});

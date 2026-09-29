/**
 * @vitest-environment node
 */

import { describe, expect, it } from "vitest";

import {
  buildRunQueryLabel,
  estimateRunDurationMs,
  filterHistoryRuns,
  formatDuration,
} from "@/components/history/history-run-utils";
import type { StoredScrapeSummary } from "@/services/scrape-history/idb";
import type { BusinessRecord } from "@/types/business-record";

function makeRecord(overrides: Partial<BusinessRecord> = {}): BusinessRecord {
  return {
    id: "rec-1",
    company_name: "Sample Cafe",
    website: "",
    email_primary: "",
    emails_all: "",
    phone_primary: "",
    phones_all: "",
    area: "Vesu",
    category: "Cafe",
    address: "",
    rating: "",
    review_count: "",
    maps_url: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    sources: "gmaps",
    first_seen: "2026-03-16T10:00:00.000Z",
    last_enriched: "2026-03-16T10:02:30.000Z",
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<StoredScrapeSummary> = {},
): StoredScrapeSummary {
  return {
    id: "job-1",
    jobId: "job-1",
    savedAt: "2026-03-16T10:03:00.000Z",
    status: "completed",
    config: {
      businessType: "Cafe",
      country: "India",
      state: "Gujarat",
      city: "Surat",
      area: "Vesu",
      target: 20,
      sources: ["gmaps"],
      searchAllLocalities: false,
    },
    summary: {
      businesses: 12,
      websites: 8,
      emails: 5,
      phones: 9,
      duplicates: 1,
    },
    recordCount: 1,
    durationMs: 150_000,
    ...overrides,
  };
}

describe("history run utils", () => {
  it("builds a compact query label", () => {
    expect(buildRunQueryLabel(makeItem())).toBe("Cafe · Vesu");
  });

  it("uses cached duration when present", () => {
    const ms = estimateRunDurationMs(makeItem());
    expect(ms).toBe(150_000);
    expect(formatDuration(ms)).toBe("2m 30s");
  });

  it("estimates duration from record timestamps when cache is missing", () => {
    const ms = estimateRunDurationMs({
      durationMs: null,
      records: [makeRecord()],
    });
    expect(ms).toBe(150_000);
  });

  it("filters by query and status", () => {
    const items = [
      makeItem(),
      makeItem({
        id: "job-2",
        jobId: "job-2",
        status: "cancelled",
        config: {
          businessType: "Bakery",
          country: "India",
          state: "Gujarat",
          city: "Ahmedabad",
          target: 10,
          sources: ["gmaps"],
          searchAllLocalities: false,
        },
      }),
    ];

    expect(filterHistoryRuns(items, "bakery", "all")).toHaveLength(1);
    expect(filterHistoryRuns(items, "", "cancelled")).toHaveLength(1);
    expect(filterHistoryRuns(items, "surat", "completed")).toHaveLength(1);
  });
});

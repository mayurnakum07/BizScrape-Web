import type { BusinessRecord } from "@/types/business-record";
import {
  hasEmail,
  hasPhone,
  hasWebsite,
} from "@/types/business-record";

export type ResultsCollectionStatus =
  | "idle"
  | "collecting"
  | "ready"
  | "empty";

export type ResultSummary = {
  businesses: number;
  websites: number;
  emails: number;
  phones: number;
  duplicates: number;
};

/**
 * Result set for one job — separate from ScrapeJobSnapshot runtime state.
 */
export type ScrapeResultsSnapshot = {
  jobId: string;
  status: ResultsCollectionStatus;
  records: BusinessRecord[];
  summary: ResultSummary;
  duplicatesRemoved: number;
  updatedAt: string;
};

export function deriveResultSummary(
  records: BusinessRecord[],
  duplicatesRemoved = 0,
): ResultSummary {
  let websites = 0;
  let emails = 0;
  let phones = 0;

  for (const record of records) {
    if (hasWebsite(record)) {
      websites += 1;
    }
    if (hasEmail(record)) {
      emails += 1;
    }
    if (hasPhone(record)) {
      phones += 1;
    }
  }

  return {
    businesses: records.length,
    websites,
    emails,
    phones,
    duplicates: duplicatesRemoved,
  };
}

export function createEmptyResults(jobId: string): ScrapeResultsSnapshot {
  return {
    jobId,
    status: "idle",
    records: [],
    summary: deriveResultSummary([]),
    duplicatesRemoved: 0,
    updatedAt: new Date().toISOString(),
  };
}

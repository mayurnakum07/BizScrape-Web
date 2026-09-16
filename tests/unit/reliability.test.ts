/**
 * Frontend reliability / error-state helpers.
 */

import { describe, expect, it } from "vitest";

import { AppError, normalizeToScrapeError } from "@/lib/errors";
import {
  applyScrapeEvent,
  createBlankJobShell,
  createEmptyResultsForJob,
} from "@/services/scrape-events/reducer";
import { titleForErrorCode } from "@/types/scrape-error";
import type { ScrapeEvent } from "@/types/scrape-events";

function evt(
  partial: Omit<ScrapeEvent, "timestamp" | "data"> & {
    data?: ScrapeEvent["data"];
  },
): ScrapeEvent {
  return {
    timestamp: "2026-09-16T10:30:00Z",
    data: partial.data ?? {},
    id: partial.id,
    type: partial.type,
    jobId: partial.jobId,
  };
}

describe("normalizeToScrapeError", () => {
  it("preserves retryable / stage / requestId from AppError", () => {
    const error = new AppError("Rate limited", {
      code: "RATE_LIMITED",
      status: 429,
      stage: "discover",
      retryable: true,
      requestId: "req-1",
      jobId: "job-1",
      partial: true,
      recordsCollected: 12,
    });
    const normalized = error.toScrapeError();
    expect(normalized.retryable).toBe(true);
    expect(normalized.stage).toBe("discover");
    expect(normalized.requestId).toBe("req-1");
    expect(normalized.recordsCollected).toBe(12);
  });

  it("maps network failures as retryable service unavailable", () => {
    const normalized = normalizeToScrapeError(
      new AppError("unreachable", {
        code: "API_NETWORK",
        status: 503,
        retryable: true,
      }),
    );
    expect(normalized.code).toBe("API_NETWORK");
    expect(titleForErrorCode(normalized.code)).toContain("unavailable");
  });
});

describe("failure / cancel reducer reliability", () => {
  it("keeps partial results on job_failed", () => {
    const jobId = "job-a";
    let state = {
      job: createBlankJobShell(jobId, { status: "running" }),
      results: createEmptyResultsForJob(jobId),
      appliedEventIds: new Set<string>(),
    };
    state = applyScrapeEvent(
      state,
      evt({
        id: "1",
        type: "results_updated",
        jobId,
        data: {
          records: [
            {
              id: "r1",
              company_name: "Cafe",
              website: "",
              email_primary: "",
              emails_all: "",
              phone_primary: "",
              phones_all: "",
              address: "",
              area: "",
              category: "",
              rating: "",
              review_count: "",
              linkedin: "",
              facebook: "",
              instagram: "",
              sources: "gmaps",
              maps_url: "",
              first_seen: "",
              last_enriched: "",
            },
          ],
        },
      }),
    );
    state = applyScrapeEvent(
      state,
      evt({
        id: "2",
        type: "job_failed",
        jobId,
        data: {
          code: "ENRICHMENT_FAILED",
          message: "Enrichment failed",
          stage: "enrich",
          retryable: true,
        },
      }),
    );
    expect(state.job.status).toBe("failed");
    expect(state.job.partialResults).toBe(true);
    expect(state.results.records).toHaveLength(1);
    expect(state.results.status).toBe("ready");
    expect(state.job.error?.retryable).toBe(true);
  });

  it("marks cancelled with retained results", () => {
    const jobId = "job-a";
    let state = {
      job: createBlankJobShell(jobId, { status: "running" }),
      results: {
        ...createEmptyResultsForJob(jobId),
        records: [
          {
            id: "r1",
            company_name: "Cafe",
            website: "",
            email_primary: "",
            emails_all: "",
            phone_primary: "",
            phones_all: "",
            address: "",
            area: "",
            category: "",
            rating: "",
            review_count: "",
            linkedin: "",
            facebook: "",
            instagram: "",
            sources: "gmaps",
            maps_url: "",
            first_seen: "",
            last_enriched: "",
          },
        ],
      },
      appliedEventIds: new Set<string>(),
    };
    state = applyScrapeEvent(
      state,
      evt({ id: "9", type: "job_cancelled", jobId }),
    );
    expect(state.job.status).toBe("cancelled");
    expect(state.job.partialResults).toBe(true);
    expect(state.job.csvReady).toBe(true);
    expect(state.job.error).toBeNull();
  });
});

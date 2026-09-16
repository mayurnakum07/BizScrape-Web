/**
 * Frontend scrape-event reducer tests.
 */

import { describe, expect, it } from "vitest";

import {
  applyScrapeEvent,
  applyScrapeEvents,
  createBlankJobShell,
  createEmptyResultsForJob,
} from "@/services/scrape-events/reducer";
import type { ScrapeEvent } from "@/types/scrape-events";

function event(
  partial: Omit<ScrapeEvent, "timestamp" | "data"> & {
    data?: ScrapeEvent["data"];
    timestamp?: string;
  },
): ScrapeEvent {
  return {
    timestamp: partial.timestamp ?? "2026-09-16T10:30:00Z",
    data: partial.data ?? {},
    id: partial.id,
    type: partial.type,
    jobId: partial.jobId,
  };
}

describe("applyScrapeEvent", () => {
  it("applies a happy-path stage sequence to completed", () => {
    const jobId = "job-a";
    const initial = {
      job: createBlankJobShell(jobId),
      results: createEmptyResultsForJob(jobId),
      appliedEventIds: new Set<string>(),
    };

    const result = applyScrapeEvents(initial, [
      event({ id: "1", type: "job_started", jobId }),
      event({
        id: "2",
        type: "stage_started",
        jobId,
        data: { stage: "discover" },
      }),
      event({
        id: "3",
        type: "business_found",
        jobId,
        data: { count: 12, kept: 10 },
      }),
      event({
        id: "4",
        type: "results_updated",
        jobId,
        data: {
          count: 1,
          records: [
            {
              id: "r1",
              company_name: "Cafe One",
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
      event({
        id: "5",
        type: "stage_completed",
        jobId,
        data: { stage: "discover" },
      }),
      event({ id: "6", type: "csv_ready", jobId, data: { count: 1 } }),
      event({ id: "7", type: "job_completed", jobId, data: { count: 1 } }),
    ]);

    expect(result.job.status).toBe("completed");
    expect(result.job.csvReady).toBe(true);
    expect(result.job.stages.discover).toBe("completed");
    expect(result.job.stats.businessesFound).toBe(12);
    expect(result.results.records).toHaveLength(1);
    expect(result.results.status).toBe("ready");
    expect(result.job.activity.some((a) => a.message.includes("Found 12"))).toBe(
      true,
    );
  });

  it("ignores duplicate event IDs", () => {
    const jobId = "job-a";
    let state = {
      job: createBlankJobShell(jobId),
      results: createEmptyResultsForJob(jobId),
      appliedEventIds: new Set<string>(),
    };

    const found = event({
      id: "3",
      type: "business_found",
      jobId,
      data: { count: 5 },
    });
    state = applyScrapeEvent(state, found);
    expect(state.job.stats.businessesFound).toBe(5);

    const dup = applyScrapeEvent(state, {
      ...found,
      data: { count: 99 },
    });
    expect(dup.changed).toBe(false);
    expect(dup.job.stats.businessesFound).toBe(5);
  });

  it("ignores events for other jobs", () => {
    const state = {
      job: createBlankJobShell("job-a"),
      results: createEmptyResultsForJob("job-a"),
      appliedEventIds: new Set<string>(),
    };
    const next = applyScrapeEvent(
      state,
      event({
        id: "1",
        type: "business_found",
        jobId: "job-b",
        data: { count: 50 },
      }),
    );
    expect(next.changed).toBe(false);
    expect(next.job.stats.businessesFound).toBe(0);
  });

  it("merges results by stable record id", () => {
    const jobId = "job-a";
    let state = {
      job: createBlankJobShell(jobId),
      results: createEmptyResultsForJob(jobId),
      appliedEventIds: new Set<string>(),
    };

    state = applyScrapeEvent(
      state,
      event({
        id: "1",
        type: "results_updated",
        jobId,
        data: {
          records: [
            {
              id: "r1",
              company_name: "Cafe One",
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
      event({
        id: "2",
        type: "results_updated",
        jobId,
        data: {
          records: [
            {
              id: "r1",
              company_name: "Cafe One",
              website: "https://example.com",
              email_primary: "a@example.com",
              emails_all: "a@example.com",
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

    expect(state.results.records).toHaveLength(1);
    expect(state.results.records[0]?.website).toBe("https://example.com");
    expect(state.results.records[0]?.email_primary).toBe("a@example.com");
  });

  it("handles job_failed without treating as cancelled", () => {
    const jobId = "job-a";
    const state = applyScrapeEvent(
      {
        job: createBlankJobShell(jobId, { status: "running" }),
        results: createEmptyResultsForJob(jobId),
        appliedEventIds: new Set(),
      },
      event({
        id: "9",
        type: "job_failed",
        jobId,
        data: {
          code: "SCRAPE_FAILED",
          message: "Enrichment failed",
          stage: "enrich",
          retryable: true,
        },
      }),
    );

    expect(state.job.status).toBe("failed");
    expect(state.job.error?.code).toBe("SCRAPE_FAILED");
    expect(state.job.error?.stage).toBe("enrich");
  });

  it("handles job_cancelled distinctly from failed", () => {
    const jobId = "job-a";
    const state = applyScrapeEvent(
      {
        job: createBlankJobShell(jobId, { status: "running" }),
        results: createEmptyResultsForJob(jobId),
        appliedEventIds: new Set(),
      },
      event({ id: "9", type: "job_cancelled", jobId }),
    );

    expect(state.job.status).toBe("cancelled");
    expect(state.job.error).toBeNull();
  });

  it("treats business_found count as cumulative (not incremented)", () => {
    const jobId = "job-a";
    let state = {
      job: createBlankJobShell(jobId),
      results: createEmptyResultsForJob(jobId),
      appliedEventIds: new Set<string>(),
    };
    state = applyScrapeEvent(
      state,
      event({ id: "1", type: "business_found", jobId, data: { count: 12 } }),
    );
    state = applyScrapeEvent(
      state,
      event({ id: "2", type: "business_found", jobId, data: { count: 14 } }),
    );
    expect(state.job.stats.businessesFound).toBe(14);
  });
});

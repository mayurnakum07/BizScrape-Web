/**
 * @vitest-environment node
 */

import { describe, expect, it } from "vitest";

import {
  validationSummaryCopy,
  workflowCopy,
  workflowKindFromScrapeError,
} from "@/lib/workflow-state";

describe("workflow state catalog", () => {
  it("provides actionable empty and filtered copy", () => {
    const empty = workflowCopy("empty_dataset");
    expect(empty.nextStep).toMatch(/scrape/i);
    const filtered = workflowCopy("filtered_empty");
    expect(filtered.nextStep).toMatch(/Clear/i);
  });

  it("maps API and export codes to kinds", () => {
    expect(workflowKindFromScrapeError({ code: "API_NETWORK" })).toBe(
      "network_failed",
    );
    expect(workflowKindFromScrapeError({ code: "CSV_EXPORT_FAILED" })).toBe(
      "export_failed",
    );
    expect(workflowKindFromScrapeError({ code: "JOB_NOT_FOUND" })).toBe(
      "job_not_found",
    );
  });

  it("summarizes validation counts", () => {
    expect(validationSummaryCopy(1).title).toBe("1 field needs attention");
    expect(validationSummaryCopy(3).title).toBe("3 fields need attention");
  });
});

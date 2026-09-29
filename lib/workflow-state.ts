/**
 * BizScrape workflow state catalog - consistent titles, explanations, and next steps.
 * Presentation only; does not replace AppError / ScrapeError normalization.
 */

import { titleForErrorCode, type ScrapeError } from "@/types/scrape-error";

export type WorkflowSeverity = "info" | "warning" | "error" | "success";

export type WorkflowKind =
  | "loading"
  | "empty_dataset"
  | "filtered_empty"
  | "empty_history"
  | "filtered_history"
  | "validation"
  | "scrape_failed"
  | "scrape_cancelled"
  | "scrape_partial"
  | "scrape_completed"
  | "idb_read_failed"
  | "idb_write_failed"
  | "idb_not_found"
  | "export_failed"
  | "export_empty"
  | "network_failed"
  | "job_not_found"
  | "location_load_failed"
  | "app_error"
  | "not_found";

export type WorkflowCopy = {
  kind: WorkflowKind;
  severity: WorkflowSeverity;
  /** Short eyebrow, e.g. "Empty dataset" */
  eyebrow?: string;
  title: string;
  description: string;
  /** Suggested next step shown under the description when no custom actions. */
  nextStep?: string;
};

export const WORKFLOW_COPY: Record<WorkflowKind, WorkflowCopy> = {
  loading: {
    kind: "loading",
    severity: "info",
    eyebrow: "Loading",
    title: "Preparing workspace",
    description: "Fetching the latest data for this view.",
  },
  empty_dataset: {
    kind: "empty_dataset",
    severity: "info",
    eyebrow: "Empty dataset",
    title: "No businesses in this result set",
    description:
      "The scrape finished without collecting any business rows for this query.",
    nextStep: "Edit the query (broader area or category) and start a new scrape.",
  },
  filtered_empty: {
    kind: "filtered_empty",
    severity: "info",
    eyebrow: "No matches",
    title: "No businesses match your filters",
    description:
      "Search text or filters removed every row from the current view. The full dataset is still available.",
    nextStep: "Clear search and filters to show all collected businesses.",
  },
  empty_history: {
    kind: "empty_history",
    severity: "info",
    eyebrow: "Run library",
    title: "No saved runs yet",
    description:
      "When a scrape finishes, BizScrape stores the result set in this browser (IndexedDB) so you can reopen or export it later.",
    nextStep: "Start a scrape to create your first saved dataset.",
  },
  filtered_history: {
    kind: "filtered_history",
    severity: "info",
    eyebrow: "No matches",
    title: "No runs match this search",
    description:
      "Nothing in the local run library matches the current search or status filter.",
    nextStep: "Clear filters or try a different query, location, or status.",
  },
  validation: {
    kind: "validation",
    severity: "warning",
    eyebrow: "Check inputs",
    title: "Some fields need attention",
    description:
      "Fix the highlighted fields before starting the scrape. Required values include category, location, target count, and discovery source.",
    nextStep: "Correct the marked fields, then start the scrape again.",
  },
  scrape_failed: {
    kind: "scrape_failed",
    severity: "error",
    eyebrow: "Scrape failed",
    title: "Scraping stopped before completion",
    description:
      "The job ended with an error. Any businesses already collected may still be available to review or export.",
    nextStep: "Retry the job, edit the query, or open partial results if available.",
  },
  scrape_cancelled: {
    kind: "scrape_cancelled",
    severity: "warning",
    eyebrow: "Scrape cancelled",
    title: "Scraping was stopped",
    description:
      "The run was cancelled before the target was reached. Collected businesses remain available in this session.",
    nextStep: "Start again with the same query, edit the query, or export what was collected.",
  },
  scrape_partial: {
    kind: "scrape_partial",
    severity: "warning",
    eyebrow: "Partial dataset",
    title: "This dataset may be incomplete",
    description:
      "Fewer businesses were saved than the scrape target, or the run stopped early. Coverage metrics reflect what was collected.",
    nextStep: "Export what you have, or retry the scrape to collect more rows.",
  },
  scrape_completed: {
    kind: "scrape_completed",
    severity: "success",
    eyebrow: "Complete",
    title: "Scraping completed",
    description:
      "The pipeline finished. Review the dataset, open individual businesses, or download the CSV.",
    nextStep: "Open results or export CSV. The dataset is also saved in this browser when possible.",
  },
  idb_read_failed: {
    kind: "idb_read_failed",
    severity: "error",
    eyebrow: "Local storage",
    title: "Could not read saved data",
    description:
      "IndexedDB in this browser could not load the scrape history or dataset. Private mode, storage quotas, or permissions can block access.",
    nextStep: "Try again, use another browser profile, or start a new scrape and export CSV.",
  },
  idb_write_failed: {
    kind: "idb_write_failed",
    severity: "warning",
    eyebrow: "Local storage",
    title: "Could not save this run to history",
    description:
      "Results are still available on this page, but IndexedDB did not store them for later. Closing the tab may lose this dataset.",
    nextStep: "Download CSV now so you keep a portable copy, then check browser storage settings.",
  },
  idb_not_found: {
    kind: "idb_not_found",
    severity: "warning",
    eyebrow: "Dataset missing",
    title: "Saved dataset not found",
    description:
      "This scrape is not in IndexedDB on this browser. It may have been deleted, or you are on a different profile or device.",
    nextStep: "Return to history or start a new scrape.",
  },
  export_failed: {
    kind: "export_failed",
    severity: "error",
    eyebrow: "Export failed",
    title: "CSV could not be generated",
    description:
      "Businesses are still in the dataset. The download step failed - this does not re-run the scraper.",
    nextStep: "Retry export. If it keeps failing, copy rows from the table or try another browser.",
  },
  export_empty: {
    kind: "export_empty",
    severity: "info",
    eyebrow: "Nothing to export",
    title: "No records available for CSV",
    description:
      "Export needs at least one business row. Filters do not change the full-dataset export until rows exist.",
    nextStep: "Wait for results, clear filters if the table is empty, or run a new scrape.",
  },
  network_failed: {
    kind: "network_failed",
    severity: "error",
    eyebrow: "Connection",
    title: "Could not reach the scrape service",
    description:
      "The browser could not complete an API request. Check your network, or confirm the API URL if you use a remote backend.",
    nextStep: "Retry the action. Live jobs may still be running even if updates paused.",
  },
  job_not_found: {
    kind: "job_not_found",
    severity: "warning",
    eyebrow: "Job missing",
    title: "This scrape job is unavailable",
    description:
      "No job with this ID is loaded in the current browser session. Mock jobs do not survive a full reload unless saved to history.",
    nextStep: "Open History for saved datasets, or configure a new scrape.",
  },
  location_load_failed: {
    kind: "location_load_failed",
    severity: "warning",
    eyebrow: "Location lists",
    title: "Could not load location options",
    description:
      "Country, state, or city lists failed to load. You can still type values where the form allows, or retry after reconnecting.",
    nextStep: "Refresh the page or check your network, then reopen the scrape form.",
  },
  app_error: {
    kind: "app_error",
    severity: "error",
    eyebrow: "Error",
    title: "Something went wrong in the app",
    description:
      "An unexpected UI error occurred. Your scrape data may still be intact in this session or in History.",
    nextStep: "Try again. If the problem continues, export any open results and reload.",
  },
  not_found: {
    kind: "not_found",
    severity: "info",
    eyebrow: "Not found",
    title: "Page not found",
    description: "That URL does not match a BizScrape screen.",
    nextStep: "Go to the homepage or open Scrape / History from the navigation.",
  },
};

export function workflowCopy(kind: WorkflowKind): WorkflowCopy {
  return WORKFLOW_COPY[kind];
}

/** Map scrape/API codes onto catalog kinds for consistent framing. */
export function workflowKindFromScrapeError(error: Pick<ScrapeError, "code">): WorkflowKind {
  switch (error.code) {
    case "API_NETWORK":
    case "SERVICE_UNAVAILABLE":
    case "API_URL_MISSING":
    case "API_TIMEOUT":
    case "API_REQUEST_FAILED":
    case "HTTP_ERROR":
      return "network_failed";
    case "CSV_EXPORT_FAILED":
    case "CSV_DOWNLOAD_UNAVAILABLE":
    case "CSV_UNAVAILABLE":
    case "EXPORT_FAILED":
      return "export_failed";
    case "CSV_EMPTY_DATASET":
    case "CSV_NOT_READY":
      return "export_empty";
    case "JOB_NOT_FOUND":
      return "job_not_found";
    case "INVALID_CONFIGURATION":
    case "VALIDATION_ERROR":
      return "validation";
    default:
      return "scrape_failed";
  }
}

export function workflowCopyForScrapeError(error: ScrapeError): WorkflowCopy {
  const kind = workflowKindFromScrapeError(error);
  const base = workflowCopy(kind);
  return {
    ...base,
    title: titleForErrorCode(error.code),
    description: error.message || base.description,
  };
}

export function validationSummaryCopy(errorCount: number): WorkflowCopy {
  const base = workflowCopy("validation");
  return {
    ...base,
    title:
      errorCount === 1
        ? "1 field needs attention"
        : `${errorCount} fields need attention`,
    description:
      errorCount === 1
        ? "Fix the highlighted field before starting the scrape."
        : `Fix the ${errorCount} highlighted fields before starting the scrape.`,
  };
}

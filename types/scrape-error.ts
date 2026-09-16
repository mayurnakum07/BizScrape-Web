/**
 * Shared scrape / API error model (normalized for UI).
 */

export type ScrapeErrorCode =
  | "INVALID_CONFIGURATION"
  | "VALIDATION_ERROR"
  | "JOB_NOT_FOUND"
  | "JOB_CAPACITY"
  | "JOB_NOT_RETRYABLE"
  | "JOB_RETRY_LIMIT"
  | "JOB_ALREADY_TERMINAL"
  | "JOB_CANCEL_IN_PROGRESS"
  | "SCRAPER_START_FAILED"
  | "BROWSER_START_FAILED"
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_BLOCKED"
  | "RATE_LIMITED"
  | "WEBSITE_LOOKUP_FAILED"
  | "ENRICHMENT_FAILED"
  | "EXPORT_FAILED"
  | "CSV_NOT_READY"
  | "CSV_UNAVAILABLE"
  | "CSV_EMPTY_DATASET"
  | "CSV_EXPORT_FAILED"
  | "CSV_DOWNLOAD_UNAVAILABLE"
  | "SCRAPE_FAILED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "CLIENT_CONNECTION_LOST"
  | "API_TIMEOUT"
  | "API_NETWORK"
  | "API_URL_MISSING"
  | "API_REQUEST_FAILED"
  | "HTTP_ERROR"
  | "APP_ERROR";

export type ScrapeError = {
  code: string;
  message: string;
  stage?: string;
  retryable: boolean;
  jobId?: string;
  requestId?: string;
  status?: number;
  details?: Record<string, unknown> | string;
  partial?: boolean;
  recordsCollected?: number;
};

export function isRetryableError(error: ScrapeError | null | undefined): boolean {
  return Boolean(error?.retryable);
}

export function titleForErrorCode(code: string): string {
  switch (code) {
    case "SOURCE_UNAVAILABLE":
      return "Unable to discover businesses";
    case "SOURCE_BLOCKED":
      return "Source access was blocked";
    case "RATE_LIMITED":
      return "Source temporarily unavailable";
    case "BROWSER_START_FAILED":
    case "SCRAPER_START_FAILED":
      return "Scraper could not start";
    case "WEBSITE_LOOKUP_FAILED":
      return "Website lookup could not be completed";
    case "ENRICHMENT_FAILED":
      return "Some enrichment could not be completed";
    case "EXPORT_FAILED":
    case "CSV_EXPORT_FAILED":
    case "CSV_DOWNLOAD_UNAVAILABLE":
      return "CSV could not be generated";
    case "API_NETWORK":
    case "SERVICE_UNAVAILABLE":
    case "API_URL_MISSING":
      return "Scraper service unavailable";
    case "CLIENT_CONNECTION_LOST":
      return "Unable to reconnect to live updates";
    case "JOB_RETRY_LIMIT":
      return "Retry limit reached";
    default:
      return "Scraping couldn't complete";
  }
}

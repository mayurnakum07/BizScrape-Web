/**
 * Shared domain types for the web app.
 * Scraping behavior remains owned by the Python CLI engine.
 */

/** Supported discovery sources (Google Maps only). */
export type ScrapeSourceId = "gmaps";

/**
 * User-facing scrape configuration from the web form.
 * This is the single request object passed toward the Python backend.
 */
export type ScrapeConfig = {
  businessType: string;
  country: string;
  state: string;
  city: string;
  /** Empty / omitted = city-wide search. */
  area?: string;
  target: number;
  sources: ScrapeSourceId[];
  /**
   * When true, expand search across known localities for the city
   * (mirrors CLI locality-expansion behavior when available).
   */
  searchAllLocalities: boolean;
};

/** Lifecycle of a scrape job managed via the future API. */
export type ScrapeJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "draft";

/** Payload shape aligned for future API create-job calls. */
export type ScrapeJobRequest = {
  niche: string;
  country: string;
  state: string;
  city: string;
  area?: string;
  targetCount: number;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
};

export type ScrapeJob = {
  id: string;
  status: ScrapeJobStatus;
  request: ScrapeJobRequest;
  createdAt: string;
  updatedAt: string;
  resultCsvUrl?: string;
  errorMessage?: string;
};

/** Real-time progress payload (SSE / WebSocket — future). */
export type ScrapeProgressEvent = {
  jobId: string;
  stage: string;
  message: string;
  current?: number;
  total?: number;
  timestamp: string;
};

/** Convert form config → API request body. */
export function toScrapeJobRequest(config: ScrapeConfig): ScrapeJobRequest {
  return {
    niche: config.businessType,
    country: config.country,
    state: config.state,
    city: config.city,
    area: config.area,
    targetCount: config.target,
    sources: config.sources,
    searchAllLocalities: config.searchAllLocalities,
  };
}

/** City string sent to the Maps engine (city + state + country). */
export function formatEngineCity(config: Pick<ScrapeConfig, "city" | "state" | "country">): string {
  return [config.city, config.state, config.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

/** Human-readable location for headers and summaries. */
export function formatLocationLabel(
  config: Pick<ScrapeConfig, "city" | "state" | "country" | "area">,
): string {
  const base = [config.city, config.state, config.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const area = config.area?.trim();
  if (area && base) {
    return `${area}, ${base}`;
  }
  return area || base;
}

/**
 * Authoritative scrape event envelope (matches Python SSE payload).
 */

import type { BusinessRecord } from "@/types/business-record";
import type { PipelineStageId } from "@/types/scrape-job";

export type ScrapeEventType =
  | "job_queued"
  | "job_started"
  | "stage_started"
  | "stage_progress"
  | "business_found"
  | "business_updated"
  | "website_found"
  | "email_found"
  | "phone_found"
  | "deduplicated"
  | "stage_completed"
  | "results_updated"
  | "csv_ready"
  | "job_completed"
  | "job_failed"
  | "job_cancelled";

export type ScrapeEventData = {
  stage?: PipelineStageId | string;
  stage_label?: string;
  query?: string;
  count?: number;
  found?: number;
  kept?: number;
  rejected?: number;
  stored?: number;
  target?: number;
  emails?: number;
  records?: BusinessRecord[];
  code?: string;
  message?: string;
  retryable?: boolean;
  status?: string;
  removed?: number;
};

export type ScrapeEvent = {
  id: string;
  type: ScrapeEventType | string;
  jobId: string;
  timestamp: string;
  data: ScrapeEventData;
};

export const TERMINAL_SCRAPE_EVENT_TYPES = new Set([
  "job_completed",
  "job_failed",
  "job_cancelled",
]);

export function isTerminalScrapeEvent(type: string): boolean {
  return TERMINAL_SCRAPE_EVENT_TYPES.has(type);
}

export function parseScrapeEvent(raw: unknown): ScrapeEvent | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.type !== "string" ||
    typeof value.jobId !== "string" ||
    typeof value.timestamp !== "string"
  ) {
    return null;
  }
  const data =
    value.data && typeof value.data === "object"
      ? (value.data as ScrapeEventData)
      : {};
  return {
    id: value.id,
    type: value.type,
    jobId: value.jobId,
    timestamp: value.timestamp,
    data,
  };
}

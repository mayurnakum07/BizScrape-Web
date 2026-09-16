"use client";

import { useEffect } from "react";

import { getScrapeJob, startScrapeJob } from "@/services/scrape-job";
import { isTerminalJobStatus } from "@/types/scrape-job";

/**
 * Ensures the job's live SSE stream (or mock driver) is attached for `jobId`.
 * Prefer `useScrapeJob` for reading snapshot state — this hook is the
 * connection lifecycle helper.
 */
export function useScrapeEvents(jobId: string): void {
  useEffect(() => {
    if (!jobId) {
      return;
    }
    const job = getScrapeJob(jobId);
    if (job && !isTerminalJobStatus(job.status)) {
      startScrapeJob(jobId);
    }
  }, [jobId]);
}

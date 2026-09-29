"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { isRemoteApiConfigured } from "@/services/scrape-api/client";
import {
  getScrapeJob,
  refreshScrapeJob,
  startScrapeJob,
  subscribeScrapeJob,
} from "@/services/scrape-job";
import { isTerminalJobStatus, type ScrapeJobSnapshot } from "@/types/scrape-job";

/**
 * Subscribes to a job by ID and ensures the mock/remote provider is attached.
 * Leaving the page does not cancel the job - only Stop scraping does.
 */
export function useScrapeJob(jobId: string): ScrapeJobSnapshot | null {
  // Subscribe must be referentially stable - a new function each render
  // causes useSyncExternalStore to resubscribe, which restarts SSE and loops.
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeScrapeJob(jobId, onStoreChange),
    [jobId],
  );
  const getSnapshot = useCallback(() => getScrapeJob(jobId), [jobId]);
  const getServerSnapshot = useCallback(() => null, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    async function ensureAttached() {
      let job = getScrapeJob(jobId);
      // Remote jobs live in API memory - hydrate after refresh / deep link.
      if (!job && isRemoteApiConfigured()) {
        await refreshScrapeJob(jobId);
        if (cancelled) {
          return;
        }
        job = getScrapeJob(jobId);
      }
      if (!job || cancelled) {
        return;
      }
      if (!isTerminalJobStatus(job.status)) {
        startScrapeJob(jobId);
      }
    }

    void ensureAttached();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return snapshot;
}

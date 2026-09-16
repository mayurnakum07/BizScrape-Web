"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { getScrapeJob } from "@/services/scrape-job";
import {
  getScrapeResults,
  startScrapeResultsCollection,
  subscribeScrapeResults,
} from "@/services/scrape-results";
import {
  createEmptyResults,
  type ScrapeResultsSnapshot,
} from "@/types/scrape-results";
import { isTerminalJobStatus } from "@/types/scrape-job";

/** Stable empty snapshots — `useSyncExternalStore` requires referential equality. */
const emptyResultsCache = new Map<string, ScrapeResultsSnapshot>();

function getStableEmptyResults(jobId: string): ScrapeResultsSnapshot {
  let cached = emptyResultsCache.get(jobId);
  if (!cached) {
    cached = createEmptyResults(jobId);
    emptyResultsCache.set(jobId, cached);
  }
  return cached;
}

export function useScrapeResults(jobId: string): ScrapeResultsSnapshot {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeScrapeResults(jobId, onStoreChange),
    [jobId],
  );
  const getSnapshot = useCallback(
    () => getScrapeResults(jobId) ?? getStableEmptyResults(jobId),
    [jobId],
  );
  const getServerSnapshot = useCallback(
    () => getStableEmptyResults(jobId),
    [jobId],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const job = getScrapeJob(jobId);
    if (!job) {
      return;
    }
    if (!isTerminalJobStatus(job.status) || job.status === "completed") {
      startScrapeResultsCollection(jobId, {
        target: job.config.target,
        duplicatesRemoved: job.stats.duplicatesRemoved,
      });
    }
  }, [jobId]);

  return snapshot;
}

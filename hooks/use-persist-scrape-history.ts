"use client";

import { useEffect, useRef, useState } from "react";

import { upsertScrapeFromJob } from "@/services/scrape-history/idb";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

export type PersistScrapeHistoryState = {
  persistError: string | null;
  dismissPersistError: () => void;
};

/**
 * Persist completed / cancelled job result sets into IndexedDB once records exist.
 * Surfaces write failures without breaking the job UI.
 */
export function usePersistScrapeHistory(
  job: ScrapeJobSnapshot | null,
  results: ScrapeResultsSnapshot,
): PersistScrapeHistoryState {
  const savedSignature = useRef<string>("");
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    if (!job) {
      return;
    }
    if (results.records.length === 0) {
      return;
    }
    if (
      job.status !== "completed" &&
      job.status !== "cancelled" &&
      results.status !== "ready"
    ) {
      return;
    }

    const signature = `${job.id}:${results.records.length}:${results.status}:${job.status}`;
    if (savedSignature.current === signature) {
      return;
    }
    savedSignature.current = signature;

    const status =
      job.status === "cancelled"
        ? "cancelled"
        : results.status === "ready" || job.status === "completed"
          ? "completed"
          : "partial";

    void upsertScrapeFromJob({
      jobId: job.id,
      config: {
        businessType: job.config.businessType,
        country: job.config.country ?? "",
        state: job.config.state ?? "",
        city: job.config.city,
        area: job.config.area,
        target: job.config.target,
        sources: job.config.sources,
        searchAllLocalities: job.config.searchAllLocalities,
      },
      records: results.records,
      summary: results.summary,
      status,
    })
      .then(() => {
        setPersistError(null);
      })
      .catch((error) => {
        setPersistError(
          error instanceof Error
            ? error.message
            : "IndexedDB could not save this run.",
        );
      });
  }, [job, results]);

  return {
    persistError,
    dismissPersistError: () => setPersistError(null),
  };
}

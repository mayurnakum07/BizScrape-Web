"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/errors/error-state";
import { RetryAction } from "@/components/errors/retry-action";
import { ResultsExportActions } from "@/components/results/results-export-actions";
import { buttonClassName } from "@/components/ui/button";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { isRemoteApiConfigured } from "@/services/scrape-api/client";
import { createScrapeJob, retryScrapeJob } from "@/services/scrape-job";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobCancelledStateProps = {
  job: ScrapeJobSnapshot;
};

export function JobCancelledState({ job }: JobCancelledStateProps) {
  const router = useRouter();
  const results = useScrapeResults(job.id);
  const [retrying, setRetrying] = useState(false);
  const collected =
    results.records.length || job.targetProgress.collected || 0;

  async function tryAgain() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    try {
      if (isRemoteApiConfigured()) {
        const fresh = await retryScrapeJob(job.id);
        router.push(`${SCRAPE_PATH}/job/${fresh.id}`);
        return;
      }
      const fresh = await createScrapeJob(job.config);
      router.push(`${SCRAPE_PATH}/job/${fresh.id}`);
    } catch (error) {
      setRetrying(false);
      window.alert(getErrorMessage(error, "Could not start a new job."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ErrorState
        severity="warning"
        error={{
          code: "JOB_CANCELLED",
          message:
            collected > 0
              ? `The job was stopped. ${collected} businesses collected before cancel remain available.`
              : "The job was stopped before any businesses were collected.",
          retryable: true,
          jobId: job.id,
          partial: collected > 0,
          recordsCollected: collected,
        }}
        title="Scraping cancelled"
        actions={
          <>
            <RetryAction
              onRetry={tryAgain}
              loading={retrying}
              label="Start a new search"
            />
            {results.records.length > 0 ? (
              <Link
                href={`${SCRAPE_PATH}/job/${job.id}/results`}
                className={buttonClassName({ variant: "secondary" })}
              >
                View results
              </Link>
            ) : null}
            <Link
              href={SCRAPE_PATH}
              className={buttonClassName({ variant: "ghost" })}
            >
              Back to configuration
            </Link>
          </>
        }
      />

      {results.records.length > 0 ? (
        <ResultsExportActions
          records={results.records}
          config={job.config}
          size="sm"
          partial
        />
      ) : null}
    </div>
  );
}

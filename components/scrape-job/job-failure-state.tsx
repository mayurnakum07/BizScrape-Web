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
import { getErrorMessage, normalizeToScrapeError } from "@/lib/errors";
import { createScrapeJob, retryScrapeJob } from "@/services/scrape-job";
import { isRemoteApiConfigured } from "@/services/scrape-api/client";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobFailureStateProps = {
  job: ScrapeJobSnapshot;
};

export function JobFailureState({ job }: JobFailureStateProps) {
  const router = useRouter();
  const results = useScrapeResults(job.id);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const collected =
    results.records.length ||
    job.targetProgress.collected ||
    job.stats.businessesFound;
  const partial =
    Boolean(job.partialResults) ||
    results.records.length > 0 ||
    (typeof job.error?.details === "object" &&
      Boolean((job.error.details as { partial?: boolean }).partial));

  const scrapeError = normalizeToScrapeError(job.error ?? {}, {
    code: job.error?.code ?? "SCRAPE_FAILED",
    message: job.error?.message ?? "The job stopped unexpectedly.",
    stage: job.error?.stage,
    retryable: job.error?.retryable ?? false,
    jobId: job.id,
    partial,
    recordsCollected: collected,
  });

  async function tryAgain() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      if (isRemoteApiConfigured()) {
        const fresh = await retryScrapeJob(job.id);
        router.push(`${SCRAPE_PATH}/job/${fresh.id}`);
        return;
      }
      const fresh = await createScrapeJob(job.config);
      router.push(`${SCRAPE_PATH}/job/${fresh.id}`);
    } catch (error) {
      setRetryError(getErrorMessage(error, "Could not start a retry."));
      setRetrying(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ErrorState
        error={scrapeError}
        actions={
          <>
            {scrapeError.retryable ? (
              <RetryAction
                onRetry={tryAgain}
                loading={retrying}
                label="Retry job"
              />
            ) : null}
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
              Change search
            </Link>
          </>
        }
      />

      {retryError ? (
        <p className="text-sm text-error" role="alert">
          {retryError}
        </p>
      ) : null}

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

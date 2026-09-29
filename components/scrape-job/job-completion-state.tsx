"use client";

import Link from "next/link";

import { ResultsExportActions } from "@/components/results/results-export-actions";
import { buttonClassName } from "@/components/ui/button";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobCompletionStateProps = {
  job: ScrapeJobSnapshot;
};

export function JobCompletionState({ job }: JobCompletionStateProps) {
  const results = useScrapeResults(job.id);

  return (
    <section
      aria-labelledby="job-complete-heading"
      className="motion-state-enter border border-success/40 bg-success-muted"
    >
      <div className="border-b border-success/25 px-4 py-3 sm:px-5">
        <p className="font-mono text-[0.65rem] tracking-wide text-success uppercase">
          Complete
        </p>
        <h2 id="job-complete-heading" className="text-section-heading mt-1">
          Scraping completed
        </h2>
        <p className="mt-1 text-small">
          Pipeline finished. Review the dataset or download the CSV (18 columns,
          UTF-8 with BOM).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-success/25 bg-success/10 sm:grid-cols-4">
        {[
          ["Collected", job.targetProgress.collected],
          ["Result rows", results.summary.businesses],
          ["Websites", job.stats.websitesResolved],
          ["Emails", job.stats.emailsFound],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-surface/40 px-4 py-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${SCRAPE_PATH}/job/${job.id}/results`}
            className={buttonClassName()}
          >
            View results
          </Link>
          <Link
            href={SCRAPE_PATH}
            className={buttonClassName({ variant: "ghost" })}
          >
            New scrape
          </Link>
        </div>
        <ResultsExportActions
          records={results.records}
          config={job.config}
          size="sm"
        />
      </div>
    </section>
  );
}

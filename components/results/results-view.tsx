"use client";

import { DatasetWorkspace } from "@/components/results/dataset-workspace";
import { ResultsHeader } from "@/components/results/results-header";
import { ResultsSummary } from "@/components/results/results-summary";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

type ResultsViewProps = {
  job: ScrapeJobSnapshot;
  results: ScrapeResultsSnapshot;
};

export function ResultsView({ job, results }: ResultsViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <ResultsHeader job={job} results={results} />
      <ResultsSummary summary={results.summary} />
      <DatasetWorkspace
        records={results.records}
        totalCount={results.summary.businesses}
        config={job.config}
        collectionStatus={results.status}
      />
    </div>
  );
}

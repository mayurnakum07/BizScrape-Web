"use client";

import Link from "next/link";

import { ResultsExportActions } from "@/components/results/results-export-actions";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobCompletionStateProps = {
  job: ScrapeJobSnapshot;
};

export function JobCompletionState({ job }: JobCompletionStateProps) {
  const results = useScrapeResults(job.id);

  return (
    <Card padding="lg" className="border-success/30 bg-success-muted/20">
      <CardHeader>
        <CardTitle>Scraping completed</CardTitle>
        <p className="text-small">
          The pipeline finished successfully. Review the dataset or download the
          complete CSV (18 BizScrape columns, UTF-8 with BOM).
        </p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="text-sm">
            <span className="text-muted">Businesses collected · </span>
            <span className="font-mono">{job.targetProgress.collected}</span>
          </li>
          <li className="text-sm">
            <span className="text-muted">Result rows · </span>
            <span className="font-mono">{results.summary.businesses}</span>
          </li>
          <li className="text-sm">
            <span className="text-muted">Websites found · </span>
            <span className="font-mono">{job.stats.websitesResolved}</span>
          </li>
          <li className="text-sm">
            <span className="text-muted">Emails found · </span>
            <span className="font-mono">{job.stats.emailsFound}</span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-4">
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
      </CardContent>
    </Card>
  );
}

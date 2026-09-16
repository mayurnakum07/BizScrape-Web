import Link from "next/link";

import { JobStatusBadge } from "@/components/scrape-job/job-status-badge";
import { Badge } from "@/components/ui/badge";
import { SCRAPE_PATH } from "@/lib/constants";
import { formatJobLocation } from "@/services/scrape-job/snapshot";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

type ResultsHeaderProps = {
  job: ScrapeJobSnapshot;
  results: ScrapeResultsSnapshot;
};

export function ResultsHeader({ job, results }: ResultsHeaderProps) {
  const location = formatJobLocation(job.config);
  const collecting = results.status === "collecting";

  return (
    <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm tracking-wide text-primary uppercase">
            Scraping results
          </p>
          {collecting ? <Badge variant="info">Collecting</Badge> : null}
          {results.status === "ready" ? (
            <Badge variant="success">Complete</Badge>
          ) : null}
        </div>
        <h1 className="text-page-heading mt-2">{job.config.businessType}</h1>
        <p className="mt-2 text-small">
          {location}
          <span className="mx-2 text-border">·</span>
          {results.summary.businesses} businesses collected
        </p>
        <p className="mt-3">
          <Link
            href={`${SCRAPE_PATH}/job/${job.id}`}
            className="text-sm text-muted transition-ui hover:text-foreground"
          >
            ← Back to job
          </Link>
        </p>
      </div>
      <div className="shrink-0 sm:pt-1">
        <JobStatusBadge status={job.status} connection={job.connection} />
      </div>
    </header>
  );
}

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
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[0.65rem] tracking-wide text-primary uppercase">
            Results workspace
          </p>
          {collecting ? <Badge variant="info">Collecting</Badge> : null}
          {results.status === "ready" ? (
            <Badge variant="success">Ready</Badge>
          ) : null}
          {results.status === "empty" ? (
            <Badge variant="warning">Empty</Badge>
          ) : null}
        </div>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          {job.config.businessType}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {location}
          {job.config.area?.trim() ? ` · ${job.config.area.trim()}` : ""}
          <span className="mx-2 text-border">·</span>
          <span className="font-mono tabular-nums text-foreground">
            {results.summary.businesses}
          </span>{" "}
          businesses
        </p>
        <p className="mt-2">
          <Link
            href={`${SCRAPE_PATH}/job/${job.id}`}
            className="font-mono text-xs text-muted transition-ui hover:text-foreground"
          >
            ← Job workspace
          </Link>
        </p>
      </div>
      <div className="shrink-0">
        <JobStatusBadge status={job.status} connection={job.connection} />
      </div>
    </header>
  );
}

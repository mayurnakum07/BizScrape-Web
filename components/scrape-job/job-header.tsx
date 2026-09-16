import Link from "next/link";

import { JobStatusBadge } from "@/components/scrape-job/job-status-badge";
import { Badge } from "@/components/ui/badge";
import { SCRAPE_PATH } from "@/lib/constants";
import { formatJobLocation } from "@/services/scrape-job/snapshot";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobHeaderProps = {
  job: ScrapeJobSnapshot;
};

export function JobHeader({ job }: JobHeaderProps) {
  const location = formatJobLocation(job.config);

  return (
    <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm tracking-wide text-primary uppercase">
            Scraping businesses
          </p>
          {job.provider === "mock" ? (
            <Badge variant="warning">Dev mock</Badge>
          ) : null}
        </div>
        <h1 className="text-page-heading mt-2">{job.config.businessType}</h1>
        <p className="mt-2 text-small">
          {location}
          <span className="mx-2 text-border">·</span>
          Target: {job.config.target} businesses
        </p>
        <p className="mt-3">
          <Link
            href={SCRAPE_PATH}
            className="text-sm text-muted transition-ui hover:text-foreground"
          >
            ← Modify search
          </Link>
          <span className="mt-1 block text-xs text-muted">
            Leaving this page does not stop the job. Use Stop scraping to cancel.
          </span>
        </p>
      </div>

      <div className="shrink-0 sm:pt-1">
        <JobStatusBadge status={job.status} connection={job.connection} />
        <p className="mt-2 font-mono text-xs text-muted">
          job/{job.id.slice(0, 8)}
        </p>
      </div>
    </header>
  );
}

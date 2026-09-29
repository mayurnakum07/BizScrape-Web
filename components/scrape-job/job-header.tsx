import Link from "next/link";

import { JobActions } from "@/components/scrape-job/job-actions";
import { JobStatusBadge } from "@/components/scrape-job/job-status-badge";
import { Badge } from "@/components/ui/badge";
import { SCRAPE_PATH } from "@/lib/constants";
import { formatJobLocation } from "@/services/scrape-job/snapshot";
import {
  isTerminalJobStatus,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";
import { cn } from "@/lib/cn";

type JobHeaderProps = {
  job: ScrapeJobSnapshot;
};

function buildQueryLine(job: ScrapeJobSnapshot): string {
  const type = job.config.businessType.trim() || "…";
  const location = formatJobLocation(job.config);
  const area = job.config.area?.trim();
  const place = area ? `${area}, ${location}` : location;
  return `${type} · ${place} · target ${job.config.target}`;
}

/**
 * Workspace chrome: live query, status, and primary stop control.
 */
export function JobHeader({ job }: JobHeaderProps) {
  const location = formatJobLocation(job.config);
  const running = !isTerminalJobStatus(job.status);

  return (
    <header className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="font-mono text-[0.65rem] tracking-wide text-primary uppercase">
            Extraction workspace
          </p>
          {job.provider === "mock" ? (
            <Badge variant="warning">Dev mock</Badge>
          ) : null}
          {job.partialResults ? (
            <Badge variant="warning">Partial</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <JobStatusBadge status={job.status} connection={job.connection} />
          <p className="font-mono text-xs text-muted">
            job/{job.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h1 className="text-page-heading break-anywhere">
            {job.config.businessType}
          </h1>
          <p className="mt-1 text-small">
            {location}
            {job.config.area?.trim() ? (
              <>
                <span className="mx-2 text-border">·</span>
                {job.config.area.trim()}
              </>
            ) : null}
            <span className="mx-2 text-border">·</span>
            Target {job.config.target}
          </p>
          <p className="mt-3 border border-border-subtle bg-terminal px-3 py-2 font-mono text-xs leading-relaxed break-anywhere text-terminal-fg">
            {buildQueryLine(job)}
          </p>
          <p className="mt-3 text-xs text-muted">
            <Link
              href={SCRAPE_PATH}
              className="text-muted transition-ui hover:text-foreground"
            >
              ← Modify search
            </Link>
            {running ? (
              <span className="mt-1 block sm:mt-0 sm:ml-2 sm:inline">
                Leaving this page does not stop the job. Use Stop scrape to
                cancel.
              </span>
            ) : null}
          </p>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 sm:items-end",
            !running && "lg:pb-1",
          )}
        >
          <JobActions job={job} stopOnly />
        </div>
      </div>
    </header>
  );
}

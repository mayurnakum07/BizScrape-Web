"use client";

import Link from "next/link";
import { memo, useMemo } from "react";

import { buttonClassName } from "@/components/ui/button";
import { useScrapeResults } from "@/hooks/use-scrape-results";
import { SCRAPE_PATH } from "@/lib/constants";
import {
  websiteHostname,
  type BusinessRecord,
} from "@/types/business-record";

type JobLatestResultsProps = {
  jobId: string;
};

export function JobLatestResults({ jobId }: JobLatestResultsProps) {
  const results = useScrapeResults(jobId);
  const latest = useMemo(
    () => results.records.slice(-3).reverse(),
    [results.records],
  );

  if (results.records.length === 0 && results.status !== "collecting") {
    return null;
  }

  return (
    <section
      aria-labelledby="latest-results-heading"
      className="border border-border bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2
            id="latest-results-heading"
            className="font-mono text-[0.65rem] tracking-wide text-muted uppercase"
          >
            Latest results
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {results.status === "collecting"
              ? "Records appear as the scrape progresses."
              : `${results.summary.businesses} businesses in this result set.`}
          </p>
        </div>
        <Link
          href={`${SCRAPE_PATH}/job/${jobId}/results`}
          className="text-sm text-primary transition-ui hover:text-primary-hover"
        >
          View all →
        </Link>
      </div>

      <div className="px-4 py-2">
        {latest.length === 0 ? (
          <p className="py-2 text-sm text-muted">Waiting for first records…</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {latest.map((record) => (
              <LatestRow key={record.id} record={record} />
            ))}
          </ul>
        )}
        <Link
          href={`${SCRAPE_PATH}/job/${jobId}/results`}
          className={buttonClassName({
            variant: "secondary",
            size: "sm",
            className: "my-3",
          })}
        >
          Open results
        </Link>
      </div>
    </section>
  );
}

const LatestRow = memo(function LatestRow({
  record,
}: {
  record: BusinessRecord;
}) {
  const host = websiteHostname(record.website);
  return (
    <li className="flex items-start justify-between gap-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{record.company_name}</p>
        <p className="text-muted">{record.area.trim() || "—"}</p>
      </div>
      <p className="shrink-0 font-mono text-xs text-muted">{host || "—"}</p>
    </li>
  );
});

"use client";

import Link from "next/link";
import { memo, useMemo } from "react";

import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const latest = useMemo(() => results.records.slice(-3).reverse(), [results.records]);

  if (results.records.length === 0 && results.status !== "collecting") {
    return null;
  }

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Latest results</CardTitle>
          <Link
            href={`${SCRAPE_PATH}/job/${jobId}/results`}
            className="text-sm text-primary hover:underline"
          >
            View all results →
          </Link>
        </div>
        <p className="text-small">
          {results.status === "collecting"
            ? "Records appear here as the scrape progresses."
            : `${results.summary.businesses} businesses in this result set.`}
        </p>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-sm text-muted">Waiting for first records…</p>
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
            className: "mt-4",
          })}
        >
          Open results
        </Link>
      </CardContent>
    </Card>
  );
}

const LatestRow = memo(function LatestRow({ record }: { record: BusinessRecord }) {
  const host = websiteHostname(record.website);
  return (
    <li className="flex items-start justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{record.company_name}</p>
        <p className="text-muted">{record.area.trim() || "—"}</p>
      </div>
      <p className="shrink-0 font-mono text-xs text-muted">{host || "—"}</p>
    </li>
  );
});

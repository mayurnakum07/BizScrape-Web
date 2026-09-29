"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-border bg-card/50 shadow-sm overflow-hidden mt-6">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
              Latest results
            </CardTitle>
            <CardDescription className="mt-1">
              {results.status === "collecting"
                ? "Records appear as the scrape progresses."
                : `${results.summary.businesses} businesses in this result set.`}
            </CardDescription>
          </div>
          <Link
            href={`${SCRAPE_PATH}/job/${jobId}/results`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {latest.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Waiting for first records…</p>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {latest.map((record) => (
                <LatestRow key={record.id} record={record} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        <div className="pt-4 mt-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`${SCRAPE_PATH}/job/${jobId}/results`}>
              Open results
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const LatestRow = memo(function LatestRow({
  record,
}: {
  record: BusinessRecord;
}) {
  const host = websiteHostname(record.website);
  return (
    <motion.li 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-between gap-3 py-3 text-sm hover:bg-muted/10 transition-colors -mx-4 px-4"
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{record.company_name}</p>
        <p className="text-muted-foreground truncate">{record.area.trim() || "-"}</p>
      </div>
      <p className="shrink-0 font-mono text-xs text-muted-foreground pt-0.5">{host || "-"}</p>
    </motion.li>
  );
});

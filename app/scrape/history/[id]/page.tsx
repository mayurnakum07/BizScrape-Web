"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { SavedDatasetView } from "@/components/history/saved-dataset-view";
import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/hooks/use-is-client";
import { useStoredScrape } from "@/hooks/use-scrape-history";
import { SCRAPE_PATH } from "@/lib/constants";

function SavedDatasetLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-surface px-3 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-10" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden border border-border bg-surface">
        <div className="border-b border-border-subtle px-3 py-3">
          <Skeleton className="h-9 w-full max-w-md" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border-b border-border-subtle px-3 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading saved dataset…</span>
    </div>
  );
}

export default function StoredScrapePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isClient = useIsClient();
  const { item, loading, error } = useStoredScrape(id);

  if (!isClient || loading) {
    return (
      <Container size="wide" className="py-10 sm:py-14">
        <SavedDatasetLoading />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16 sm:py-20">
        <WorkflowStatePanel
          kind="idb_read_failed"
          copy={{ description: error }}
          actions={
            <Link
              href={`${SCRAPE_PATH}/history`}
              className={buttonClassName()}
            >
              Back to history
            </Link>
          }
        />
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-16 sm:py-20">
        <WorkflowStatePanel
          kind="idb_not_found"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`${SCRAPE_PATH}/history`}
                className={buttonClassName()}
              >
                Back to history
              </Link>
              <Link
                href={SCRAPE_PATH}
                className={buttonClassName({ variant: "outline" })}
              >
                Start a scrape
              </Link>
            </div>
          }
        />
      </Container>
    );
  }

  return (
    <Container size="wide" className="py-10 sm:py-14">
      <SavedDatasetView item={item} />
    </Container>
  );
}

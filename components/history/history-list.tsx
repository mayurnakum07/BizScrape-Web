"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { HistoryRunItem } from "@/components/history/history-run-item";
import { HistoryToolbar } from "@/components/history/history-toolbar";
import {
  filterHistoryRuns,
  type HistoryStatusFilter,
} from "@/components/history/history-run-utils";
import { Button, buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { useScrapeHistoryList } from "@/hooks/use-scrape-history";
import { SCRAPE_PATH } from "@/lib/constants";

function HistoryLoadingRows() {
  return (
    <ul className="divide-y divide-border-subtle" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] lg:items-center lg:gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HistoryList() {
  const { items, loading, error, remove, refresh } = useScrapeHistoryList();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HistoryStatusFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => filterHistoryRuns(items, deferredQuery, status),
    [items, deferredQuery, status],
  );

  if (loading) {
    return (
      <section
        aria-label="Scrape runs"
        className="history-workspace overflow-hidden border border-border bg-surface"
      >
        <div className="border-b border-border-subtle px-3 py-3 sm:px-4">
          <Skeleton className="h-9 w-full max-w-md" />
        </div>
        <HistoryLoadingRows />
        <span className="sr-only">Loading scrape history…</span>
      </section>
    );
  }

  if (error) {
    return (
      <WorkflowStatePanel
        kind="idb_read_failed"
        variant="panel"
        copy={{ description: error }}
        actions={
          <Button type="button" size="sm" onClick={() => void refresh()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <WorkflowStatePanel
        kind="empty_history"
        actions={
          <Link href={SCRAPE_PATH} className={buttonClassName()}>
            Start a scrape
          </Link>
        }
      />
    );
  }

  return (
    <section
      aria-label="Scrape runs"
      className="history-workspace overflow-hidden border border-border bg-surface"
    >
      <HistoryToolbar
        query={query}
        status={status}
        total={items.length}
        visible={filtered.length}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <WorkflowStatePanel
          kind="filtered_history"
          variant="empty"
          className="m-3 border-0 bg-transparent sm:m-4"
          actions={
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul>
          {filtered.map((item) => (
            <HistoryRunItem
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onDelete={async (id) => {
                setBusyId(id);
                try {
                  await remove(id);
                } finally {
                  setBusyId(null);
                }
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

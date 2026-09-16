"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useScrapeHistoryList } from "@/hooks/use-scrape-history";
import { SCRAPE_PATH } from "@/lib/constants";
import { formatLocationLabel } from "@/types/scrape";
import { exportAndDownloadCsv } from "@/services/export/csv";

function formatSavedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function HistoryList() {
  const { items, loading, error, remove, refresh } = useScrapeHistoryList();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="py-16">
        <Spinner label="Loading scrape history…" />
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Could not load history</CardTitle>
          <p className="text-small">{error}</p>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => void refresh()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No saved scrapes yet"
        description="When a scrape finishes, BizScrape stores the result set in this browser so you can reopen or download it later."
        action={
          <Link href={SCRAPE_PATH} className={buttonClassName()}>
            Start a scrape
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const location = formatLocationLabel(item.config);
        return (
          <li key={item.id}>
            <Card padding="md" className="transition-ui hover:bg-surface-hover/40">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-foreground">
                      {item.config.businessType}
                    </h2>
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "success"
                          : item.status === "cancelled"
                            ? "warning"
                            : "info"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{location}</p>
                  <p className="mt-2 font-mono text-xs text-muted">
                    {item.summary.businesses} businesses · saved{" "}
                    {formatSavedAt(item.savedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    href={`${SCRAPE_PATH}/history/${item.id}`}
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                  >
                    View
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id || item.records.length === 0}
                    onClick={() => {
                      exportAndDownloadCsv({
                        records: item.records,
                        config: {
                          city: item.config.city,
                          businessType: item.config.businessType,
                        },
                      });
                    }}
                  >
                    Download CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={busyId === item.id}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Delete this saved scrape from this browser?",
                        )
                      ) {
                        return;
                      }
                      setBusyId(item.id);
                      void remove(item.id).finally(() => setBusyId(null));
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

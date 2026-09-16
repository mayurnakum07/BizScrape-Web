"use client";

import { ErrorBanner } from "@/components/errors/error-banner";
import { Button } from "@/components/ui/button";
import type { JobConnectionState } from "@/types/scrape-job";

type ConnectionStateProps = {
  connection: JobConnectionState;
  onRefresh?: () => void;
};

export function ConnectionStateBanner({
  connection,
  onRefresh,
}: ConnectionStateProps) {
  if (connection === "connected") {
    return null;
  }

  if (connection === "offline") {
    return (
      <ErrorBanner
        severity="warning"
        title="Unable to reconnect to live updates"
        description="The scraper may still be running. Refresh the job state to check its current status."
      >
        {onRefresh ? (
          <Button type="button" size="sm" variant="secondary" onClick={onRefresh}>
            Refresh job state
          </Button>
        ) : null}
      </ErrorBanner>
    );
  }

  return (
    <ErrorBanner
      severity="warning"
      title={
        connection === "interrupted"
          ? "Live updates interrupted"
          : "Reconnecting…"
      }
      description={
        connection === "interrupted"
          ? "Connection to live updates interrupted. The scraping job may still be running."
          : "Restoring the live event stream. The scrape is not marked failed solely because of this interruption."
      }
    />
  );
}

"use client";

import { ConnectionStateBanner } from "@/components/errors/connection-state";
import { refreshScrapeJob } from "@/services/scrape-job";
import type { JobConnectionState } from "@/types/scrape-job";

type JobConnectionBannerProps = {
  jobId: string;
  connection: JobConnectionState;
};

export function JobConnectionBanner({
  jobId,
  connection,
}: JobConnectionBannerProps) {
  return (
    <ConnectionStateBanner
      connection={connection}
      onRefresh={() => {
        void refreshScrapeJob(jobId);
      }}
    />
  );
}

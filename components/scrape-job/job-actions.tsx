"use client";

import { useState } from "react";

import { CancellationDialog } from "@/components/errors/cancellation-dialog";
import { Button } from "@/components/ui/button";
import {
  cancelScrapeJob,
  simulateJobConnectionInterrupt,
  simulateJobFailure,
} from "@/services/scrape-job";
import {
  isTerminalJobStatus,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";

type JobActionsProps = {
  job: ScrapeJobSnapshot;
};

export function JobActions({ job }: JobActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCancel =
    !isTerminalJobStatus(job.status) && job.status === "cancelling"
      ? false
      : !isTerminalJobStatus(job.status) && job.status !== "cancelling";

  const isCancelling = cancelling || job.status === "cancelling";

  async function confirmCancel() {
    if (isCancelling) {
      return;
    }
    setCancelling(true);
    setConfirmOpen(false);
    try {
      await cancelScrapeJob(job.id);
    } finally {
      // Keep loading until backend confirms cancelled (status drives UI).
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {canCancel ? (
          <Button
            variant="destructive"
            loading={isCancelling}
            onClick={() => setConfirmOpen(true)}
          >
            Stop scraping
          </Button>
        ) : null}
        {job.status === "cancelling" ? (
          <p className="text-sm text-muted" role="status">
            Stopping scraper… Cleaning up the running browser process.
          </p>
        ) : null}
      </div>

      {job.provider === "mock" ? (
        <div className="rounded-md border border-border-subtle bg-background-elevated p-3">
          <p className="text-xs font-medium text-muted">
            Development controls (mock provider only)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isTerminalJobStatus(job.status)}
              onClick={() => simulateJobConnectionInterrupt(job.id)}
            >
              Simulate disconnect
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isTerminalJobStatus(job.status)}
              onClick={() => simulateJobFailure(job.id)}
            >
              Simulate failure
            </Button>
          </div>
        </div>
      ) : null}

      <CancellationDialog
        open={confirmOpen}
        collectedCount={job.targetProgress.collected}
        onKeepRunning={() => setConfirmOpen(false)}
        onConfirmStop={() => {
          void confirmCancel();
        }}
      />
    </div>
  );
}

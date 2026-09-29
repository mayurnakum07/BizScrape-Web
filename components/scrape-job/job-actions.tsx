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
  /** Header placement: stop control only. */
  stopOnly?: boolean;
  /** Footer placement: mock provider tools only. */
  devOnly?: boolean;
};

export function JobActions({
  job,
  stopOnly = false,
  devOnly = false,
}: JobActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCancel =
    !isTerminalJobStatus(job.status) && job.status !== "cancelling";

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
      setCancelling(false);
    }
  }

  if (devOnly) {
    if (job.provider !== "mock") {
      return null;
    }
    return (
      <div className="border border-border-subtle bg-elevated p-3">
        <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Dev controls · mock only
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
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {canCancel ? (
          <Button
            variant="destructive"
            size={stopOnly ? "md" : "lg"}
            loading={isCancelling}
            onClick={() => setConfirmOpen(true)}
          >
            Stop scrape
          </Button>
        ) : null}
        {job.status === "cancelling" ? (
          <p className="text-sm text-warning" role="status">
            Stopping… cleaning up the browser process.
          </p>
        ) : null}
      </div>

      {!stopOnly && job.provider === "mock" ? (
        <div className="border border-border-subtle bg-elevated p-3">
          <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
            Dev controls · mock only
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

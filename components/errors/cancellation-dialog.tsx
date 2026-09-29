"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type CancellationDialogProps = {
  open: boolean;
  collectedCount: number;
  onKeepRunning: () => void;
  onConfirmStop: () => void;
};

export function CancellationDialog({
  open,
  collectedCount,
  onKeepRunning,
  onConfirmStop,
}: CancellationDialogProps) {
  const hasPartial = collectedCount > 0;
  return (
    <Dialog
      open={open}
      onClose={onKeepRunning}
      title="Stop this scrape?"
      description={
        hasPartial
          ? `Businesses already collected (${collectedCount}) will remain available, but the job will stop processing new records.`
          : "The job will stop processing. You can start a new search afterward."
      }
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={onConfirmStop}
        >
          Stop scrape
        </Button>
        <Button
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={onKeepRunning}
        >
          Keep running
        </Button>
      </div>
    </Dialog>
  );
}

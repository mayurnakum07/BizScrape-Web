"use client";

import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={(val) => !val && onKeepRunning()}>
      <DialogContent className="sm:max-w-md bg-black/95 border-primary/20 shadow-[0_0_30px_rgba(200,240,74,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-primary font-mono tracking-wide">Stop this scrape_job?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {hasPartial
              ? `Businesses already collected (${collectedCount}) will remain available, but the job will stop processing new records.`
              : "The job will stop processing. You can start a new search afterward."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={onKeepRunning}
          >
            Keep running
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={onConfirmStop}
          >
            Stop scrape
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

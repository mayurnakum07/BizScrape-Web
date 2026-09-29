"use client";

import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { Button } from "@/components/ui/button";

type PersistHistoryBannerProps = {
  error: string | null;
  onDismiss: () => void;
  onExportHint?: boolean;
};

export function PersistHistoryBanner({
  error,
  onDismiss,
  onExportHint = true,
}: PersistHistoryBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <WorkflowStatePanel
      kind="idb_write_failed"
      variant="banner"
      copy={{
        description: onExportHint
          ? `${error} Results remain on this page — download CSV before closing the tab.`
          : error,
      }}
      actions={
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      }
    />
  );
}

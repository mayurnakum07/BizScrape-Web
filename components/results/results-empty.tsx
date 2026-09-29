import type { ReactNode } from "react";

import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResultsCollectionStatus } from "@/types/scrape-results";

type ResultsEmptyProps = {
  status: ResultsCollectionStatus;
  filteredEmpty: boolean;
  /** Saved datasets use quieter empty copy. */
  variant?: "live" | "saved";
  actions?: ReactNode;
};

export function ResultsEmpty({
  status,
  filteredEmpty,
  variant = "live",
  actions,
}: ResultsEmptyProps) {
  if (filteredEmpty) {
    return (
      <WorkflowStatePanel
        kind="filtered_empty"
        variant="empty"
        className="m-3 border-0 bg-transparent sm:m-4"
        actions={actions}
      />
    );
  }

  if (variant === "saved") {
    return (
      <WorkflowStatePanel
        kind="empty_dataset"
        variant="empty"
        className="m-3 border-0 bg-transparent sm:m-4"
        copy={{
          title: "No rows in this saved dataset",
          description:
            "This IndexedDB scrape has no business records. The run may have finished empty or been saved before collection completed.",
          nextStep:
            "Retry the scrape from the header, or delete this empty dataset from History.",
        }}
        actions={actions}
      />
    );
  }

  if (status === "collecting" || status === "idle") {
    return (
      <WorkflowStatePanel
        kind="loading"
        variant="empty"
        className="m-3 border-0 bg-transparent sm:m-4"
        copy={{
          eyebrow: "Collecting",
          title: "Waiting for businesses",
          description:
            "Rows appear here as BizScrape discovers and enriches listings for your query.",
          nextStep: "Keep this tab open. Closing the panel does not stop the job.",
        }}
        actions={actions}
      />
    );
  }

  return (
    <WorkflowStatePanel
      kind="empty_dataset"
      variant="empty"
      className="m-3 border-0 bg-transparent sm:m-4"
      actions={actions}
    />
  );
}

export function ResultsLoadingRows({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <div className="space-y-2 p-3 md:hidden" aria-hidden="true">
        {Array.from({ length: Math.min(rows, 5) }).map((_, index) => (
          <div
            key={index}
            className="border border-border bg-elevated p-3.5"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <Skeleton className="mt-2 h-3 w-3/5" />
          </div>
        ))}
      </div>
      <div className="hidden space-y-0 md:block" aria-hidden="true">
        <div className="border-b border-border-subtle bg-elevated px-3 py-2">
          <Skeleton className="h-3 w-40" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1.2fr_1fr_1.1fr_0.8fr_0.6fr] gap-3 border-b border-border-subtle px-3 py-2.5"
          >
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </>
  );
}

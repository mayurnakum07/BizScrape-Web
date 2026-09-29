import { Spinner } from "@/components/ui/spinner";
import { workflowCopy } from "@/lib/workflow-state";

/**
 * Route-level loading UI - fills the viewport below the sticky header.
 */
export default function Loading() {
  const copy = workflowCopy("loading");

  return (
    <div
      className="flex min-h-[calc(100dvh-var(--header-height))] w-full flex-col items-center justify-center px-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <Spinner label={copy.title} size="lg" className="flex-col text-foreground" />
        {copy.description ? (
          <p className="text-small">{copy.description}</p>
        ) : null}
      </div>
    </div>
  );
}

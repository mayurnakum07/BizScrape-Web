import { PIPELINE_STAGES, type ScrapeJobSnapshot } from "@/types/scrape-job";
import { cn } from "@/lib/cn";

type JobPipelineProps = {
  job: ScrapeJobSnapshot;
};

export function JobPipeline({ job }: JobPipelineProps) {
  return (
    <section aria-label="Pipeline stages">
      <h2 className="text-sm font-medium text-muted">Pipeline</h2>
      <ol className="mt-4 flex flex-col gap-2 md:grid md:grid-cols-5 md:gap-3">
        {PIPELINE_STAGES.map((stage, index) => {
          const state = job.stages[stage.id];
          const isActive = state === "active";

          return (
            <li
              key={stage.id}
              className="relative md:min-w-0"
            >
              {index > 0 ? (
                <span
                  className="mb-1 block text-center font-mono text-xs text-border md:hidden"
                  aria-hidden="true"
                >
                  ↓
                </span>
              ) : null}
              <div
                className={cn(
                  "rounded-lg border px-3 py-3 transition-ui md:min-w-0",
                  isActive && "border-primary/50 bg-primary-muted shadow-[var(--shadow-sm)]",
                  state === "completed" && "border-border bg-surface",
                  state === "pending" && "border-border-subtle bg-background-elevated",
                  state === "failed" && "border-error/40 bg-error-muted",
                  state === "skipped" && "border-border-subtle bg-background-elevated opacity-60",
                )}
              >
                <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                >
                  {stage.shortLabel}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {state === "pending" && "Pending"}
                  {state === "active" && "Active"}
                  {state === "completed" && "Done"}
                  {state === "failed" && "Failed"}
                  {state === "skipped" && "Skipped"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 break-anywhere text-sm text-muted" aria-live="polite">
        {job.operationMessage}
      </p>
    </section>
  );
}

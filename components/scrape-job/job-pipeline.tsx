import {
  PIPELINE_STAGES,
  isTerminalJobStatus,
  type ScrapeJobSnapshot,
  type StageRunStatus,
} from "@/types/scrape-job";
import { cn } from "@/lib/cn";

type JobPipelineProps = {
  job: ScrapeJobSnapshot;
};

const stateLabel: Record<StageRunStatus, string> = {
  pending: "Queued",
  active: "Processing",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

function stageClasses(state: StageRunStatus): string {
  return cn(
    "relative bg-surface px-3 py-3 transition-ui",
    state === "pending" && "text-muted",
    state === "active" && "job-stage-active bg-primary-muted",
    state === "completed" && "bg-surface",
    state === "failed" && "bg-error-muted",
    state === "skipped" && "bg-elevated opacity-55",
  );
}

/**
 * Focused pipeline visualization with distinct stage run states.
 */
export function JobPipeline({ job }: JobPipelineProps) {
  const animateActive =
    !isTerminalJobStatus(job.status) &&
    job.status !== "cancelling" &&
    (job.status === "running" ||
      job.status === "starting" ||
      job.status === "queued");

  return (
    <section aria-label="Pipeline stages" className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <h2 className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Pipeline
        </h2>
        <p className="font-mono text-[0.65rem] text-muted">
          {job.progress.stageIndex > 0
            ? `Stage ${job.progress.stageIndex}/${job.progress.stageCount}`
            : "Waiting"}
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
        {PIPELINE_STAGES.map((stage, index) => {
          const state = job.stages[stage.id];
          const isActive = state === "active";

          return (
            <li
              key={stage.id}
              className={stageClasses(state)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[0.65rem] tracking-wide text-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                {isActive ? (
                  <span
                    className={cn(
                      "size-1.5 shrink-0 bg-primary",
                      animateActive && "job-stage-pulse",
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-1.5 text-sm font-medium",
                  isActive ? "text-primary" : "text-foreground",
                  state === "failed" && "text-error",
                  state === "pending" && "text-muted",
                )}
              >
                {stage.shortLabel}
              </p>
              <p
                className={cn(
                  "mt-1 font-mono text-[0.65rem] tracking-wide uppercase",
                  state === "active" && "text-primary",
                  state === "completed" && "text-success",
                  state === "failed" && "text-error",
                  (state === "skipped" || state === "pending") && "text-muted",
                )}
              >
                {stateLabel[state]}
              </p>
            </li>
          );
        })}
      </ol>

      <p
        className="border-t border-border-subtle px-4 py-3 text-sm text-muted break-anywhere"
        aria-live="polite"
      >
        {job.operationMessage || "Waiting for engine updates…"}
      </p>
    </section>
  );
}

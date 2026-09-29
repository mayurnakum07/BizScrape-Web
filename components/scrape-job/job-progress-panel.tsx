import { Progress } from "@/components/ui/progress";
import {
  isTerminalJobStatus,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";
import { cn } from "@/lib/cn";

type JobProgressPanelProps = {
  job: ScrapeJobSnapshot;
};

export function JobProgressPanel({ job }: JobProgressPanelProps) {
  const { progress, targetProgress, status } = job;
  const running = !isTerminalJobStatus(status) && status !== "cancelling";
  const percent =
    progress.mode === "indeterminate"
      ? undefined
      : Math.min(100, Math.max(0, progress.percent ?? 0));
  const towardTarget = Math.min(
    100,
    Math.round(
      (targetProgress.collected / Math.max(targetProgress.target, 1)) * 100,
    ),
  );

  return (
    <section
      aria-label="Progress"
      className="grid gap-px border border-border bg-border sm:grid-cols-2"
    >
      <div className="bg-surface px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">
            Pipeline progress
          </h2>
          <span className="font-mono text-xs text-muted">
            {progress.stageIndex > 0
              ? `${progress.stageIndex}/${progress.stageCount}`
              : "—"}
          </span>
        </div>

        {progress.mode === "indeterminate" || percent === undefined ? (
          <>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-sm bg-border-subtle"
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext="In progress"
            >
              <div
                className={cn(
                  "h-full w-1/3 rounded-sm bg-primary/70",
                  running && "motion-indeterminate",
                )}
              />
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              Scrape is in progress. Waiting for a precise percentage update.
            </p>
          </>
        ) : (
          <div className="mt-4">
            <Progress value={percent} showValue />
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Estimate until the engine reports precise progress.
        </p>
      </div>

      <div className="bg-surface px-4 py-4">
        <h2 className="text-sm font-medium text-foreground">
          Records processed
        </h2>
        <p className="job-metric-value mt-3 font-mono text-2xl text-foreground">
          {targetProgress.collected}
          <span className="text-muted"> / {targetProgress.target}</span>
        </p>
        <div className="mt-4">
          <Progress value={towardTarget} showValue />
        </div>
        <p className="mt-2 text-xs text-muted">Toward configured target.</p>
      </div>
    </section>
  );
}

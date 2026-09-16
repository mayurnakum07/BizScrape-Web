import { Progress } from "@/components/ui/progress";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

type JobProgressPanelProps = {
  job: ScrapeJobSnapshot;
};

export function JobProgressPanel({ job }: JobProgressPanelProps) {
  const { progress, targetProgress } = job;
  const stageLabel =
    progress.stageIndex > 0
      ? `Stage ${progress.stageIndex} of ${progress.stageCount}`
      : "Waiting for first stage";

  const percent =
    progress.mode === "indeterminate"
      ? undefined
      : Math.min(100, Math.max(0, progress.percent ?? 0));

  return (
    <section aria-label="Progress" className="grid gap-4 sm:grid-cols-2 sm:gap-6">
      <div className="min-w-0 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
          <h2 className="text-sm font-medium text-foreground">
            Overall progress
          </h2>
          <span className="font-mono text-xs text-muted">{stageLabel}</span>
        </div>

        {progress.mode === "indeterminate" || percent === undefined ? (
          <>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-border-subtle"
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext="In progress"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              Scrape is in progress. Waiting for a precise percentage update.
            </p>
          </>
        ) : (
          <div className="mt-4">
            <Progress value={percent} label="Pipeline" showValue />
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Pipeline percentage is an estimate until the engine reports precise
          progress.
        </p>
      </div>

      <div className="min-w-0 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-foreground">
          Businesses collected
        </h2>
        <p className="mt-3 font-mono text-xl tabular-nums text-foreground sm:text-2xl">
          {targetProgress.collected}
          <span className="text-muted"> / {targetProgress.target}</span>
        </p>
        <div className="mt-4">
          <Progress
            value={Math.min(
              100,
              Math.round(
                (targetProgress.collected / Math.max(targetProgress.target, 1)) *
                  100,
              ),
            )}
            label="Toward target"
            showValue
          />
        </div>
      </div>
    </section>
  );
}

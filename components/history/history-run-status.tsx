import {
  HISTORY_STATUS_LABEL,
  type HistoryRunStatus,
} from "@/components/history/history-run-utils";
import { cn } from "@/lib/cn";

const statusClasses: Record<HistoryRunStatus, string> = {
  completed: "border-success/35 bg-success-muted text-success",
  partial: "border-info/35 bg-info-muted text-info",
  cancelled: "border-warning/35 bg-warning-muted text-warning",
  running: "border-primary/40 bg-primary-muted text-primary",
  failed: "border-error/35 bg-error-muted text-error",
};

const railClasses: Record<HistoryRunStatus, string> = {
  completed: "bg-success",
  partial: "bg-info",
  cancelled: "bg-warning",
  running: "bg-primary",
  failed: "bg-error",
};

type HistoryRunStatusBadgeProps = {
  status: HistoryRunStatus;
  className?: string;
};

export function HistoryRunStatusBadge({
  status,
  className,
}: HistoryRunStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-mono text-[0.65rem] tracking-wide uppercase",
        statusClasses[status],
        className,
      )}
    >
      {HISTORY_STATUS_LABEL[status]}
    </span>
  );
}

export function historyRunRailClass(status: HistoryRunStatus): string {
  return railClasses[status];
}

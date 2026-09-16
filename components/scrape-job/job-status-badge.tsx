import { StatusIndicator } from "@/components/ui/status-indicator";
import type { JobLifecycleStatus, JobConnectionState } from "@/types/scrape-job";
import type { StatusTone } from "@/components/ui/status-indicator";

const statusMap: Record<
  JobLifecycleStatus,
  { tone: StatusTone; label: string }
> = {
  idle: { tone: "idle", label: "Idle" },
  queued: { tone: "running", label: "Queued" },
  starting: { tone: "running", label: "Starting" },
  running: { tone: "running", label: "Running" },
  cancelling: { tone: "warning", label: "Stopping" },
  cancelled: { tone: "warning", label: "Cancelled" },
  completed: { tone: "success", label: "Completed" },
  failed: { tone: "error", label: "Failed" },
};

type JobStatusBadgeProps = {
  status: JobLifecycleStatus;
  connection: JobConnectionState;
};

export function JobStatusBadge({ status, connection }: JobStatusBadgeProps) {
  if (connection === "interrupted" || connection === "reconnecting") {
    return (
      <StatusIndicator
        status="warning"
        label={
          connection === "reconnecting"
            ? "Reconnecting"
            : "Connection interrupted"
        }
      />
    );
  }

  const mapped = statusMap[status];
  return <StatusIndicator status={mapped.tone} label={mapped.label} />;
}

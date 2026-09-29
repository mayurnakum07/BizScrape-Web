import { cn } from "@/lib/cn";

export type StatusTone = "idle" | "running" | "success" | "warning" | "error";

export type StatusIndicatorProps = {
  status: StatusTone;
  label?: string;
  className?: string;
};

const statusConfig: Record<
  StatusTone,
  { label: string; dot: string; text: string }
> = {
  idle: {
    label: "Idle",
    dot: "bg-muted",
    text: "text-muted",
  },
  running: {
    label: "Running",
    dot: "bg-primary motion-live-dot",
    text: "text-primary",
  },
  success: {
    label: "Success",
    dot: "bg-success",
    text: "text-success",
  },
  warning: {
    label: "Warning",
    dot: "bg-warning",
    text: "text-warning",
  },
  error: {
    label: "Error",
    dot: "bg-error",
    text: "text-error",
  },
};

export function StatusIndicator({
  status,
  label,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const text = label ?? config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium transition-ui",
        config.text,
        className,
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", config.dot)}
        aria-hidden="true"
      />
      <span>{text}</span>
    </span>
  );
}

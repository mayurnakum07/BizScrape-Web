import { cn } from "@/lib/cn";

export type SpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Visually hide the label while keeping it for assistive tech. */
  labelHidden?: boolean;
};

const sizeClasses = {
  sm: "size-3.5 border",
  md: "size-4 border-2",
  lg: "size-6 border-2",
};

export function Spinner({
  label = "Loading",
  size = "md",
  className,
  labelHidden = false,
}: SpinnerProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-muted", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "animate-spin rounded-full border-border border-t-primary",
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      <span className={labelHidden ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}

/** @deprecated Prefer Spinner — kept for Milestone 01 compatibility. */
export function LoadingIndicator(props: SpinnerProps) {
  return <Spinner {...props} />;
}

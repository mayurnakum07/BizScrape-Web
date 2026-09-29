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
      <img 
        src="/assets/Logo-Short.png" 
        alt="" 
        aria-hidden="true"
        className={cn(
          "animate-pulse object-contain",
          size === "sm" ? "h-4" : size === "lg" ? "h-8" : "h-6"
        )} 
      />
      <span className={labelHidden ? "sr-only" : "font-mono font-bold tracking-widest text-primary animate-pulse"}>{label}</span>
    </span>
  );
}

/** @deprecated Prefer Spinner - kept for Milestone 01 compatibility. */
export function LoadingIndicator(props: SpinnerProps) {
  return <Spinner {...props} />;
}

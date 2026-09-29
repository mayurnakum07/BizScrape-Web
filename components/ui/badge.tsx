import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-border bg-surface text-muted",
  primary: "border-primary/30 bg-primary-muted text-primary",
  success: "border-success/30 bg-success-muted text-success",
  warning: "border-warning/30 bg-warning-muted text-warning",
  error: "border-error/30 bg-error-muted text-error",
  info: "border-info/30 bg-info-muted text-info",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-ui",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

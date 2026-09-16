"use client";

import { cn } from "@/lib/cn";

export type ErrorSeverity = "info" | "warning" | "error" | "success";

const severityClass: Record<ErrorSeverity, string> = {
  info: "border-border bg-background-elevated text-foreground",
  warning: "border-warning/40 bg-warning-muted/20 text-warning",
  error: "border-error/40 bg-error-muted/15 text-error",
  success: "border-success/40 bg-success-muted/20 text-success",
};

type ErrorBannerProps = {
  title: string;
  description?: string;
  severity?: ErrorSeverity;
  className?: string;
  children?: React.ReactNode;
};

export function ErrorBanner({
  title,
  description,
  severity = "error",
  className,
  children,
}: ErrorBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        severityClass[severity],
        className,
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-muted">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

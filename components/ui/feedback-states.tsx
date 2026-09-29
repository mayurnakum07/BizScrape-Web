import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

export type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Full-block loading placeholder for panels and pages.
 */
export function LoadingState({
  title = "Loading",
  description,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 px-5 py-16 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner label={title} size="lg" className="flex-col text-foreground" />
      {description ? <p className="max-w-md text-small">{description}</p> : null}
    </div>
  );
}

export type ErrorBlockProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Full-block error placeholder for panels and pages.
 * Distinct from scrape-domain `components/errors/ErrorState`.
 */
export function ErrorBlock({
  title = "Something went wrong",
  description,
  action,
  className,
}: ErrorBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-md border border-error/40 bg-error-muted px-5 py-8",
        className,
      )}
      role="alert"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-section-heading text-error">{title}</h3>
        {description ? <p className="max-w-md text-small">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

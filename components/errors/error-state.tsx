"use client";

import { useState, type ReactNode } from "react";

import { ErrorBanner } from "@/components/errors/error-banner";
import { Button } from "@/components/ui/button";
import { isDevelopmentDiagnostics } from "@/lib/errors";
import { cn } from "@/lib/cn";
import {
  titleForErrorCode,
  type ScrapeError,
} from "@/types/scrape-error";
import type { ErrorSeverity } from "@/components/errors/error-banner";

type ErrorStateProps = {
  error: ScrapeError;
  title?: string;
  description?: string;
  severity?: ErrorSeverity;
  actions?: ReactNode;
  className?: string;
};

export function ErrorState({
  error,
  title,
  description,
  severity = "error",
  actions,
  className,
}: ErrorStateProps) {
  const [open, setOpen] = useState(false);
  const heading = title ?? titleForErrorCode(error.code);
  const body = description ?? error.message;

  return (
    <section
      role="alert"
      className={cn(
        "border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5",
        severity === "warning" && "border-warning/40 bg-warning-muted/20",
        severity === "error" && "border-error/40 bg-error-muted/20",
        className,
      )}
    >
      <h2 className="text-section-heading">{heading}</h2>
      <p className="mt-1 text-small">{body}</p>

      {error.partial || (error.recordsCollected ?? 0) > 0 ? (
        <ErrorBanner
          severity="warning"
          title="Partial results available"
          description={
            typeof error.recordsCollected === "number"
              ? `${error.recordsCollected} businesses were collected before the job stopped. You can export them or open the results workspace.`
              : "Businesses already discovered are still available to review or export."
          }
          className="mt-4"
        />
      ) : null}

      {actions ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions}
        </div>
      ) : null}

      {isDevelopmentDiagnostics() ? (
        <div className="mt-4">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Hide technical details" : "Technical details"}
          </Button>
          {open ? (
            <dl className="mt-2 border border-border-subtle bg-elevated p-3 font-mono text-xs text-muted">
              <div className="flex gap-2">
                <dt>code</dt>
                <dd className="text-foreground">{error.code}</dd>
              </div>
              {error.stage ? (
                <div className="mt-1 flex gap-2">
                  <dt>stage</dt>
                  <dd className="text-foreground">{error.stage}</dd>
                </div>
              ) : null}
              {error.jobId ? (
                <div className="mt-1 flex gap-2">
                  <dt>jobId</dt>
                  <dd className="text-foreground">{error.jobId}</dd>
                </div>
              ) : null}
              {error.requestId ? (
                <div className="mt-1 flex gap-2">
                  <dt>requestId</dt>
                  <dd className="text-foreground">{error.requestId}</dd>
                </div>
              ) : null}
              <div className="mt-1 flex gap-2">
                <dt>retryable</dt>
                <dd className="text-foreground">
                  {error.retryable ? "true" : "false"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

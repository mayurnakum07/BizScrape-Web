"use client";

import { useState } from "react";

import { ErrorBanner } from "@/components/errors/error-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDevelopmentDiagnostics } from "@/lib/errors";
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
  actions?: React.ReactNode;
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
    <Card
      padding="lg"
      className={
        severity === "warning"
          ? `border-warning/30 bg-warning-muted/15 ${className ?? ""}`
          : severity === "info"
            ? `border-border bg-background-elevated ${className ?? ""}`
            : `border-error/30 bg-error-muted/15 ${className ?? ""}`
      }
    >
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        <p className="text-small">{body}</p>
      </CardHeader>
      <CardContent>
        {error.partial || (error.recordsCollected ?? 0) > 0 ? (
          <ErrorBanner
            severity="warning"
            title="Partial results available"
            description={
              typeof error.recordsCollected === "number"
                ? `${error.recordsCollected} businesses were collected before the job stopped.`
                : "Businesses already discovered are still available."
            }
            className="mb-4"
          />
        ) : null}

        {actions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
              <dl className="mt-2 rounded-md border border-border-subtle bg-background-elevated p-3 font-mono text-xs text-muted">
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
      </CardContent>
    </Card>
  );
}

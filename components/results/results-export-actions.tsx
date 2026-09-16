"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import {
  exportAndDownloadCsv,
  type CsvExportResult,
} from "@/services/export/csv";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";
import { cn } from "@/lib/cn";

type ExportStatus = "idle" | "generating" | "success" | "error";

type ResultsExportActionsProps = {
  records: BusinessRecord[];
  config: Pick<ScrapeConfig, "city" | "businessType" | "area">;
  className?: string;
  /** Compact variant for job completion card. */
  size?: "sm" | "md" | "lg";
  /** When true, clarify that the dataset may be incomplete. */
  partial?: boolean;
};

/**
 * Downloads the complete job result set (not the current search/filter view).
 * Export is independently retryable — it does not re-run the scraper.
 */
export function ResultsExportActions({
  records,
  config,
  className,
  size = "md",
  partial = false,
}: ResultsExportActionsProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [lastExport, setLastExport] = useState<CsvExportResult | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helpId = useId();
  const statusId = useId();

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const canExport = records.length > 0;
  const locationLabel = config.area?.trim()
    ? `${config.businessType} · ${config.city} · ${config.area}`
    : `${config.businessType} · ${config.city}`;

  async function handleExport() {
    if (!canExport || status === "generating") {
      return;
    }

    setStatus("generating");
    setMessage("Generating CSV…");

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      const result = exportAndDownloadCsv({
        records,
        config: {
          city: config.city,
          businessType: config.businessType,
        },
      });
      setLastExport(result);
      setStatus("success");
      setMessage(
        partial
          ? `Partial CSV ready — ${result.recordCount} records exported.`
          : `CSV ready — ${result.recordCount} records exported successfully.`,
      );

      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
      }, 4000);
    } catch (error) {
      setStatus("error");
      setMessage(
        getErrorMessage(
          error,
          "Your businesses were collected, but the CSV could not be generated.",
        ),
      );
      // Stay on error so the user can explicitly retry export.
    }
  }

  const label =
    status === "generating"
      ? "Generating CSV…"
      : status === "success"
        ? "CSV downloaded"
        : status === "error"
          ? "Retry export"
          : partial
            ? "Export available data"
            : "Download CSV";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {partial && status === "idle" ? (
        <p className="text-sm text-muted">
          Partial results — export includes businesses collected before the job
          stopped.
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          size={size}
          className="w-full sm:w-auto"
          onClick={handleExport}
          disabled={!canExport || status === "generating"}
          loading={status === "generating"}
          variant={status === "error" ? "secondary" : "primary"}
          aria-label={
            canExport
              ? `Download CSV for ${records.length} businesses`
              : "Download CSV unavailable — no records"
          }
          aria-describedby={`${helpId} ${statusId}`}
        >
          {label}
        </Button>
        {status === "error" ? (
          <Button
            type="button"
            size={size}
            variant="ghost"
            onClick={() => {
              setStatus("idle");
              setMessage("");
            }}
          >
            Dismiss
          </Button>
        ) : null}
        <p id={helpId} className="text-xs text-muted">
          Exports the complete result set ({records.length} records), not the
          current search/filter view. Does not re-run the scraper.
        </p>
      </div>

      <div id={statusId} className="min-h-5 text-sm" role="status" aria-live="polite">
        {status === "success" ? (
          <p className="text-success">
            {message}
            {lastExport ? (
              <span className="mt-0.5 block font-mono text-xs text-muted">
                {lastExport.filename}
                <span className="mx-2 text-border">·</span>
                {locationLabel}
              </span>
            ) : null}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="text-error">{message}</p>
        ) : null}
        {status === "generating" ? (
          <p className="text-muted">{message}</p>
        ) : null}
        {!canExport && status === "idle" ? (
          <p className="text-muted">No data available for export.</p>
        ) : null}
      </div>
    </div>
  );
}

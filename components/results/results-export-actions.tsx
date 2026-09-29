"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { appToast } from "@/lib/app-toast";
import { workflowCopy } from "@/lib/workflow-state";
import { exportAndDownloadCsvAsync } from "@/services/export/csv";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";
import { cn } from "@/lib/cn";

type ResultsExportActionsProps = {
  records: BusinessRecord[];
  config: Pick<ScrapeConfig, "city" | "businessType" | "area">;
  className?: string;
  /** Compact variant for job completion card. */
  size?: "sm" | "md" | "lg";
  /** When true, clarify that the dataset may be incomplete. */
  partial?: boolean;
  /** Override primary button idle label. */
  scopeLabel?: string;
  /** Override helper copy under the button. */
  helpText?: string;
  /** Extra hint when table filters differ from export scope. */
  filteredHint?: string;
  /** Tighten helper text for toolbar density. */
  compactHelp?: boolean;
};

/**
 * Downloads the provided result set as CSV.
 * Feedback uses toast notifications.
 */
export function ResultsExportActions({
  records,
  config,
  className,
  size = "md",
  partial = false,
  scopeLabel,
  helpText,
  filteredHint,
  compactHelp = false,
}: ResultsExportActionsProps) {
  const [generating, setGenerating] = useState(false);
  const helpId = useId();

  const canExport = records.length > 0;

  async function handleExport() {
    if (!canExport || generating) {
      return;
    }

    setGenerating(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      const result = await exportAndDownloadCsvAsync({
        records,
        config: {
          city: config.city,
          businessType: config.businessType,
        },
      });
      appToast.success(
        partial ? "Partial CSV downloaded" : "CSV downloaded",
        {
          description: `${result.recordCount} records · ${result.filename}`,
        },
      );
    } catch (error) {
      const exportCopy = workflowCopy("export_failed");
      appToast.error(
        exportCopy.title,
        {
          description: getErrorMessage(
            error,
            `${exportCopy.description} ${exportCopy.nextStep ?? ""}`.trim(),
          ),
        },
      );
    } finally {
      setGenerating(false);
    }
  }

  const idleLabel =
    scopeLabel ??
    (partial ? "Export available data" : "Download CSV");

  const defaultHelp = `Exports ${records.length} record${records.length === 1 ? "" : "s"} as CSV. Does not re-run the scraper.`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {partial ? (
        <p className="text-sm text-muted">
          Partial results — export includes businesses collected before the job
          stopped.
        </p>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-2",
          compactHelp
            ? "sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
            : "sm:flex-row sm:flex-wrap sm:items-center",
        )}
      >
        <Button
          type="button"
          size={size}
          className="w-full sm:w-auto"
          onClick={() => {
            void handleExport();
          }}
          disabled={!canExport || generating}
          loading={generating}
          aria-label={
            canExport
              ? `Download CSV for ${records.length} businesses`
              : "Download CSV unavailable — no records"
          }
          aria-describedby={helpId}
        >
          {generating ? "Generating CSV…" : idleLabel}
        </Button>
        <p
          id={helpId}
          className={cn(
            "text-muted",
            compactHelp ? "max-w-xs text-[0.7rem] sm:text-right" : "text-xs",
          )}
        >
          {helpText ?? defaultHelp}
          {filteredHint ? (
            <span className="mt-0.5 block text-muted">{filteredHint}</span>
          ) : null}
        </p>
      </div>

      {!canExport ? (
        <p className="text-sm text-muted">
          {workflowCopy("export_empty").description}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  HistoryRunStatusBadge,
  historyRunRailClass,
} from "@/components/history/history-run-status";
import {
  buildRunQueryLabel,
  estimateRunDurationMs,
  formatDuration,
  formatRunTimestampShort,
  resolveHistoryRunStatus,
  runLocation,
} from "@/components/history/history-run-utils";
import { Button, buttonClassName } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SCRAPE_PATH } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { exportAndDownloadCsvAsync } from "@/services/export/csv";
import { createScrapeJob } from "@/services/scrape-job";
import {
  getStoredScrape,
  type StoredScrapeSummary,
} from "@/services/scrape-history/idb";
import { appToast } from "@/lib/app-toast";

type HistoryRunItemProps = {
  item: StoredScrapeSummary;
  busy: boolean;
  onDelete: (id: string) => Promise<void>;
};

export function HistoryRunItem({ item, busy, onDelete }: HistoryRunItemProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const status = resolveHistoryRunStatus(item);
  const location = runLocation(item);
  const duration = formatDuration(estimateRunDurationMs(item));
  const datasetHref = `${SCRAPE_PATH}/history/${item.id}`;
  const queryLabel = buildRunQueryLabel(item);
  const towardTarget = Math.min(
    100,
    Math.round(
      (item.summary.businesses / Math.max(item.config.target, 1)) * 100,
    ),
  );

  async function handleRetry() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      const job = await createScrapeJob(item.config);
      setRetryOpen(false);
      router.push(`${SCRAPE_PATH}/job/${job.id}`);
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : "Could not start a retry.",
      );
      setRetrying(false);
    }
  }

  async function handleExport() {
    if (exporting || item.recordCount === 0) {
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const full = await getStoredScrape(item.id);
      if (!full?.records.length) {
        setExportError("No records available to export.");
        return;
      }
      await exportAndDownloadCsvAsync({
        records: full.records,
        config: {
          city: full.config.city,
          businessType: full.config.businessType,
        },
      });
      appToast.success("CSV downloaded", {
        description: `${full.records.length} records exported.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CSV export failed.";
      setExportError(message);
      appToast.error("Export failed", { description: message });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleting) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(item.id);
      setDeleteOpen(false);
      appToast.success("Scrape deleted", {
        description: "Removed from this browser’s History.",
      });
    } catch (error) {
      appToast.error("Delete failed", {
        description:
          error instanceof Error ? error.message : "Could not delete scrape.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li
      className={cn(
        "history-run-item relative border-b border-border-subtle last:border-b-0",
        "transition-ui hover:bg-surface-hover",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-0.5",
          historyRunRailClass(status),
        )}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 px-3 py-3 pl-4 sm:px-4 sm:pl-5 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] lg:items-center lg:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 text-sm font-medium break-anywhere">
              <Link
                href={datasetHref}
                className={cn(
                  "text-foreground transition-ui hover:text-primary hover:underline",
                  "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
                )}
              >
                {queryLabel}
              </Link>
            </h2>
            <HistoryRunStatusBadge status={status} />
          </div>
          <p className="mt-1 truncate text-xs text-muted" title={location}>
            {location || "Location unset"}
          </p>
          <p className="mt-1.5 font-mono text-xs text-muted">
            job/{item.jobId.slice(0, 8)}
            <span className="mx-1.5 text-border">·</span>
            target {item.config.target}
            <span className="mx-1.5 text-border">·</span>
            {towardTarget}% of target
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Metric label="Records" value={String(item.summary.businesses)} />
          <Metric label="Duration" value={duration} />
          <Metric label="Saved" value={formatRunTimestampShort(item.savedAt)} />
          <Metric
            label="Coverage"
            value={`${item.summary.websites}W · ${item.summary.emails}E · ${item.summary.phones}P`}
          />
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            <Link
              href={datasetHref}
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              Open
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={exporting}
              disabled={busy || exporting || item.recordCount === 0}
              onClick={() => {
                void handleExport();
              }}
            >
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy || retrying}
              onClick={() => {
                setRetryError(null);
                setRetryOpen(true);
              }}
            >
              Retry
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy || deleting}
              className="text-error hover:text-error"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
          {retryError && !retryOpen ? (
            <p className="text-xs text-error" role="alert">
              {retryError}
            </p>
          ) : null}
          {exportError ? (
            <p className="text-xs text-error" role="alert">
              {exportError}
            </p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={retryOpen}
        onClose={() => {
          if (!retrying) {
            setRetryOpen(false);
          }
        }}
        onConfirm={() => {
          void handleRetry();
        }}
        title="Retry this scrape?"
        description={`Start a new job with the same settings as “${queryLabel}”. The saved dataset stays in History.`}
        confirmLabel={retrying ? "Starting…" : "Retry scrape"}
        cancelLabel="Cancel"
        loading={retrying}
      >
        {retryError ? (
          <p className="text-sm text-error" role="alert">
            {retryError}
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title="Delete saved scrape?"
        description="Remove this dataset from this browser’s IndexedDB storage. This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Keep"
        tone="destructive"
        loading={deleting}
      />
    </li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-label text-muted">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

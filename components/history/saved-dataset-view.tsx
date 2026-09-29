"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  HistoryRunStatusBadge,
} from "@/components/history/history-run-status";
import {
  buildRunQueryLabel,
  estimateRunDurationMs,
  formatDuration,
  formatRunTimestamp,
  resolveHistoryRunStatus,
  runLocation,
} from "@/components/history/history-run-utils";
import { DatasetWorkspace } from "@/components/results/dataset-workspace";
import { ResultsSummary } from "@/components/results/results-summary";
import { WorkflowStatePanel } from "@/components/workflow/workflow-state-panel";
import { Button, buttonClassName } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SCRAPE_PATH } from "@/lib/constants";
import { appToast } from "@/lib/app-toast";
import { formatSources } from "@/types/business-record";
import { createScrapeJob } from "@/services/scrape-job";
import {
  deleteStoredScrape,
  type StoredScrape,
} from "@/services/scrape-history/idb";

type SavedDatasetHeaderProps = {
  item: StoredScrape;
  onDeleted: () => void;
};

function SavedDatasetHeader({ item, onDeleted }: SavedDatasetHeaderProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const status = resolveHistoryRunStatus(item);
  const location = runLocation(item);
  const duration = formatDuration(estimateRunDurationMs(item));
  const sources = formatSources(item.config?.sources?.join("|") ?? "");
  const queryLabel = buildRunQueryLabel(item);

  async function handleRetry() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    setActionError(null);
    try {
      const job = await createScrapeJob(item.config);
      setRetryOpen(false);
      router.push(`${SCRAPE_PATH}/job/${job.id}`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not start a retry.",
      );
      setRetrying(false);
    }
  }

  async function handleDelete() {
    if (busy) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await deleteStoredScrape(item.id);
      setDeleteOpen(false);
      appToast.success("Dataset deleted", {
        description: "Removed from this browser’s IndexedDB storage.",
      });
      onDeleted();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete dataset.";
      setActionError(message);
      appToast.error("Delete failed", { description: message });
      setBusy(false);
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs tracking-wide text-primary uppercase">
              Saved dataset
            </p>
            <HistoryRunStatusBadge status={status} />
            <span className="border border-border-subtle px-1.5 py-0.5 font-mono text-xs tracking-wide text-muted uppercase">
              Local · IndexedDB
            </span>
          </div>
          <h1 className="mt-2 text-xl font-medium tracking-tight text-foreground break-anywhere sm:text-2xl">
            {queryLabel}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {location || "Location unset"}
            <span className="mx-2 text-border">·</span>
            target {item.config?.target ?? 0}
            {sources ? (
              <>
                <span className="mx-2 text-border">·</span>
                {sources}
              </>
            ) : null}
          </p>
          <p className="mt-2 font-mono text-xs text-muted">
            <span className="tabular-nums text-foreground">
              {item.summary?.businesses ?? 0}
            </span>{" "}
            records
            <span className="mx-1.5 text-border">·</span>
            saved {formatRunTimestamp(item.savedAt)}
            <span className="mx-1.5 text-border">·</span>
            duration {duration}
            <span className="mx-1.5 text-border">·</span>
            job/{item.jobId.slice(0, 8)}
          </p>
          <p className="mt-3">
            <Link
              href={`${SCRAPE_PATH}/history`}
              className="font-mono text-xs text-muted transition-ui hover:text-foreground"
            >
              ← Back to history
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={`${SCRAPE_PATH}/job/${item.jobId}`}
              className={buttonClassName({ variant: "outline", size: "sm" })}
            >
              Open job
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || retrying}
              onClick={() => {
                setActionError(null);
                setRetryOpen(true);
              }}
            >
              Retry scrape
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-error hover:text-error"
              onClick={() => setDeleteOpen(true)}
            >
              Delete dataset
            </Button>
          </div>
          {actionError && !retryOpen && !deleteOpen ? (
            <p className="max-w-sm text-xs text-error sm:text-right" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border border-border-subtle bg-elevated px-3 py-2.5">
        <p className="text-label text-muted">Persistence</p>
        <p className="mt-1 text-sm text-foreground">
          This dataset is stored in this browser only (IndexedDB). Clearing site
          data removes it. Export CSV to keep a portable copy.
        </p>
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
        {actionError ? (
          <p className="text-sm text-error" role="alert">
            {actionError}
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (!busy) {
            setDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title="Delete saved dataset?"
        description="Remove this dataset from this browser’s IndexedDB storage. This cannot be undone."
        confirmLabel={busy ? "Deleting…" : "Delete"}
        cancelLabel="Keep"
        tone="destructive"
        loading={busy}
      />
    </header>
  );
}

type SavedDatasetViewProps = {
  item: StoredScrape;
};

/**
 * Persistent data workspace for an IndexedDB-backed scrape result set.
 * Reuses the M6 dataset workspace + M7 detail drawer.
 */
export function SavedDatasetView({ item }: SavedDatasetViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <SavedDatasetHeader
        item={item}
        onDeleted={() => {
          router.push(`${SCRAPE_PATH}/history`);
        }}
      />

      <ResultsSummary summary={item.summary ?? { businesses: 0, websites: 0, emails: 0, phones: 0, duplicates: 0 }} />

      {item.status === "partial" || item.status === "cancelled" ? (
        <WorkflowStatePanel
          kind="scrape_partial"
          variant="banner"
          copy={
            item.status === "cancelled"
              ? {
                  title: "Partial dataset - scrape was cancelled",
                  description:
                    "This IndexedDB copy was saved after the run stopped early. Coverage may be incomplete versus the original target.",
                  nextStep:
                    "Export CSV for a portable copy, or retry the scrape from the header.",
                }
              : undefined
          }
        />
      ) : null}

      <DatasetWorkspace
        records={item.records || []}
        totalCount={item.summary?.businesses ?? 0}
        config={item.config ?? {} as any}
        collectionStatus={(item.records || []).length === 0 ? "empty" : "ready"}
        emptyVariant="saved"
        ariaLabel="Saved dataset workspace"
        exportFilteredHint={
          (item.records || []).length > 0
            ? `Exports the full saved dataset (${(item.records || []).length} local records). Filters apply to the table only.`
            : undefined
        }
      />
    </div>
  );
}

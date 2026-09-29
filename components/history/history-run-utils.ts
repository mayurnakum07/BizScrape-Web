import type { StoredScrape, StoredScrapeStatus, StoredScrapeSummary } from "@/services/scrape-history/idb";
import { getScrapeJob } from "@/services/scrape-job";
import { formatLocationLabel } from "@/types/scrape";
import { isTerminalJobStatus } from "@/types/scrape-job";

/** UI status for run rows - includes live overlays when a job is still in memory. */
export type HistoryRunStatus =
  | StoredScrapeStatus
  | "running"
  | "failed";

export type HistoryStatusFilter = "all" | HistoryRunStatus;

type HistoryRunLike = Pick<
  StoredScrapeSummary,
  "id" | "jobId" | "status" | "config" | "summary" | "savedAt" | "durationMs" | "recordCount"
>;

export function resolveHistoryRunStatus(
  item: Pick<HistoryRunLike, "jobId" | "status">,
): HistoryRunStatus {
  const live = getScrapeJob(item.jobId);
  if (live) {
    if (!isTerminalJobStatus(live.status) && live.status !== "cancelling") {
      return "running";
    }
    if (live.status === "cancelling") {
      return "running";
    }
    if (live.status === "failed") {
      return "failed";
    }
  }
  return item.status;
}

export function estimateRunDurationMs(
  item: Pick<HistoryRunLike, "durationMs"> & {
    records?: StoredScrape["records"];
  },
): number | null {
  if (typeof item.durationMs === "number") {
    return item.durationMs;
  }
  if (!item.records?.length) {
    return null;
  }
  const stamps: number[] = [];
  for (const record of item.records) {
    const first = Date.parse(record.first_seen);
    const last = Date.parse(record.last_enriched);
    if (!Number.isNaN(first)) {
      stamps.push(first);
    }
    if (!Number.isNaN(last)) {
      stamps.push(last);
    }
  }
  if (stamps.length < 2) {
    return null;
  }
  const duration = Math.max(...stamps) - Math.min(...stamps);
  return duration > 0 ? duration : null;
}

export function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) {
    return "-";
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function formatRunTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRunTimestampShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function buildRunQueryLabel(
  item: Pick<HistoryRunLike, "config">,
): string {
  const type = item.config?.businessType?.trim() || "Untitled scrape";
  const area = item.config?.area?.trim();
  return area ? `${type} · ${area}` : type;
}

export function buildRunSearchText(
  item: Pick<HistoryRunLike, "config" | "status" | "jobId" | "summary">,
): string {
  return [
    item.config?.businessType,
    item.config?.area,
    item.config?.city,
    item.config?.state,
    item.config?.country,
    item.status,
    item.jobId,
    String(item.summary?.businesses ?? 0),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterHistoryRuns<T extends HistoryRunLike>(
  items: T[],
  query: string,
  status: HistoryStatusFilter,
): T[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    const runStatus = resolveHistoryRunStatus(item);
    if (status !== "all" && runStatus !== status) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return buildRunSearchText(item).includes(needle);
  });
}

export function runLocation(item: Pick<HistoryRunLike, "config">): string {
  return item.config ? formatLocationLabel(item.config) : "Location unset";
}

export const HISTORY_STATUS_LABEL: Record<HistoryRunStatus, string> = {
  completed: "Completed",
  partial: "Partial",
  cancelled: "Cancelled",
  running: "Running",
  failed: "Failed",
};

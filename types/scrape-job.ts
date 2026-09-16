/**
 * Scraping job runtime types — separate from ScrapeConfig (user request).
 * Compatible with a future Python event stream.
 */

import type { ScrapeConfig, ScrapeJobRequest, ScrapeSourceId } from "@/types/scrape";

export type {
  ScrapeConfig,
  ScrapeJobRequest,
  ScrapeSourceId,
};

/** High-level job lifecycle for the progress UI. */
export type JobLifecycleStatus =
  | "idle"
  | "queued"
  | "starting"
  | "running"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "failed";

/** Pipeline stages matching the BizScrape engine. */
export type PipelineStageId =
  | "discover"
  | "website_lookup"
  | "enrich"
  | "deduplicate"
  | "export";

export type StageRunStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped";

export type ProgressMode = "percent" | "indeterminate" | "stage";

export type JobConnectionState =
  | "connected"
  | "interrupted"
  | "reconnecting"
  | "offline";

export type JobError = {
  code: string;
  message: string;
  stage?: PipelineStageId;
  retryable: boolean;
  details?: string | Record<string, unknown>;
};

export type JobStats = {
  businessesFound: number;
  localMatches: number;
  websitesResolved: number;
  emailsFound: number;
  phonesFound: number;
  duplicatesRemoved: number;
};

export type JobProgress = {
  mode: ProgressMode;
  /** Present when mode is percent or stage-derived estimate. */
  percent?: number;
  stageIndex: number;
  stageCount: number;
};

export type JobActivityEntry = {
  id: string;
  timestamp: string;
  stage?: PipelineStageId;
  message: string;
};

export type JobProviderKind = "mock" | "remote";

/**
 * Full snapshot consumed by the job UI.
 * Configuration and runtime state are explicit fields — do not mix them.
 */
export type ScrapeJobSnapshot = {
  id: string;
  provider: JobProviderKind;
  config: ScrapeConfig;
  request: ScrapeJobRequest;
  status: JobLifecycleStatus;
  connection: JobConnectionState;
  currentStage: PipelineStageId | null;
  stages: Record<PipelineStageId, StageRunStatus>;
  progress: JobProgress;
  targetProgress: {
    collected: number;
    target: number;
  };
  stats: JobStats;
  activity: JobActivityEntry[];
  operationMessage: string;
  csvReady: boolean;
  /** True when the job ended with some collected records still available. */
  partialResults?: boolean;
  retryCount?: number;
  retryOfJobId?: string | null;
  error: JobError | null;
  createdAt: string;
  updatedAt: string;
};

export const PIPELINE_STAGES: Array<{
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "discover",
    label: "Discover",
    shortLabel: "Discover",
    description: "Searching local business listings…",
  },
  {
    id: "website_lookup",
    label: "Website lookup",
    shortLabel: "Websites",
    description: "Looking for official websites…",
  },
  {
    id: "enrich",
    label: "Enrich",
    shortLabel: "Enrich",
    description: "Extracting publicly available contact information…",
  },
  {
    id: "deduplicate",
    label: "Deduplicate",
    shortLabel: "Deduplicate",
    description: "Removing duplicate businesses…",
  },
  {
    id: "export",
    label: "Export",
    shortLabel: "Export",
    description: "Preparing your CSV…",
  },
];

export function createInitialStages(): Record<PipelineStageId, StageRunStatus> {
  return {
    discover: "pending",
    website_lookup: "pending",
    enrich: "pending",
    deduplicate: "pending",
    export: "pending",
  };
}

export function createEmptyStats(): JobStats {
  return {
    businessesFound: 0,
    localMatches: 0,
    websitesResolved: 0,
    emailsFound: 0,
    phonesFound: 0,
    duplicatesRemoved: 0,
  };
}

export function isTerminalJobStatus(status: JobLifecycleStatus): boolean {
  return (
    status === "completed" ||
    status === "failed" ||
    status === "cancelled"
  );
}

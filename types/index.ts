export type {
  ScrapeConfig,
  ScrapeJob,
  ScrapeJobRequest,
  ScrapeJobStatus,
  ScrapeProgressEvent,
  ScrapeSourceId,
} from "@/types/scrape";
export { toScrapeJobRequest } from "@/types/scrape";

export type {
  JobActivityEntry,
  JobConnectionState,
  JobError,
  JobLifecycleStatus,
  JobProgress,
  JobProviderKind,
  JobStats,
  PipelineStageId,
  ProgressMode,
  ScrapeJobSnapshot,
  StageRunStatus,
} from "@/types/scrape-job";
export {
  PIPELINE_STAGES,
  createEmptyStats,
  createInitialStages,
  isTerminalJobStatus,
} from "@/types/scrape-job";

export type { BusinessRecord } from "@/types/business-record";
export {
  formatSources,
  hasEmail,
  hasPhone,
  hasSocial,
  hasWebsite,
  normalizeExternalUrl,
  primaryEmail,
  websiteHostname,
} from "@/types/business-record";

export type {
  ResultSummary,
  ResultsCollectionStatus,
  ScrapeResultsSnapshot,
} from "@/types/scrape-results";
export {
  createEmptyResults,
  deriveResultSummary,
} from "@/types/scrape-results";

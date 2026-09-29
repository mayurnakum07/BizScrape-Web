/**
 * Central reducer: ScrapeEvent → job + results state.
 * Components must not interpret the SSE stream independently.
 */

import type { BusinessRecord } from "@/types/business-record";
import {
  isTerminalScrapeEvent,
  type ScrapeEvent,
} from "@/types/scrape-events";
import {
  PIPELINE_STAGES,
  createEmptyStats,
  createInitialStages,
  type JobActivityEntry,
  type PipelineStageId,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";
import {
  deriveResultSummary,
  type ScrapeResultsSnapshot,
} from "@/types/scrape-results";

const STAGE_IDS = new Set<string>(PIPELINE_STAGES.map((s) => s.id));

function isStageId(value: unknown): value is PipelineStageId {
  return typeof value === "string" && STAGE_IDS.has(value);
}

function activityFromEvent(event: ScrapeEvent): JobActivityEntry | null {
  const stage = isStageId(event.data.stage) ? event.data.stage : undefined;
  const count = event.data.count;
  let message: string | null = null;

  switch (event.type) {
    case "job_queued":
      message = event.data.message ?? "Job queued";
      break;
    case "job_started":
      message = "Scraping started";
      break;
    case "stage_started":
      message = {
        discover: "Discovering local businesses",
        website_lookup: "Website lookup started",
        enrich: "Enrichment started",
        deduplicate: "Deduplication started",
        export: "Export started",
      }[String(event.data.stage)] ?? `Stage started: ${event.data.stage ?? ""}`;
      break;
    case "stage_completed":
      message = `Completed ${String(event.data.stage ?? "").replaceAll("_", " ")}`;
      break;
    case "business_found":
      message =
        typeof count === "number" ? `Found ${count} businesses` : "Businesses updated";
      break;
    case "website_found":
      message =
        typeof count === "number"
          ? `${count} websites resolved`
          : "Websites updated";
      break;
    case "email_found":
      message =
        typeof count === "number" ? `${count} emails found` : "Emails updated";
      break;
    case "phone_found":
      message =
        typeof count === "number" ? `${count} phones found` : "Phones updated";
      break;
    case "csv_ready":
      message = "CSV ready";
      break;
    case "job_completed":
      message = "Job completed";
      break;
    case "job_failed":
      message = event.data.message ?? "Job failed";
      break;
    case "job_cancelled":
      message = "Job cancelled";
      break;
    case "deduplicated":
      message =
        typeof event.data.removed === "number"
          ? `Removed ${event.data.removed} duplicates`
          : "Deduplicated results";
      break;
    default:
      message = null;
  }

  if (!message) {
    return null;
  }

  return {
    id: `evt-${event.id}`,
    timestamp: event.timestamp,
    stage,
    message,
  };
}

function mergeRecords(
  existing: BusinessRecord[],
  incoming: BusinessRecord[],
): BusinessRecord[] {
  const byId = new Map<string, BusinessRecord>();
  for (const row of existing) {
    byId.set(row.id, row);
  }
  for (const row of incoming) {
    if (!row?.id) {
      continue;
    }
    const prev = byId.get(row.id);
    byId.set(row.id, prev ? { ...prev, ...row } : row);
  }
  return Array.from(byId.values());
}

export type EventReduceInput = {
  job: ScrapeJobSnapshot;
  results: ScrapeResultsSnapshot;
  /** Event IDs already applied (duplicate protection). */
  appliedEventIds: Set<string>;
};

export type EventReduceOutput = {
  job: ScrapeJobSnapshot;
  results: ScrapeResultsSnapshot;
  appliedEventIds: Set<string>;
  changed: boolean;
};

export function applyScrapeEvent(
  input: EventReduceInput,
  event: ScrapeEvent,
): EventReduceOutput {
  if (event.jobId !== input.job.id) {
    return { ...input, changed: false };
  }
  if (input.appliedEventIds.has(event.id)) {
    return { ...input, changed: false };
  }

  const appliedEventIds = new Set(input.appliedEventIds);
  appliedEventIds.add(event.id);

  let job: ScrapeJobSnapshot = {
    ...input.job,
    updatedAt: event.timestamp,
  };
  let results: ScrapeResultsSnapshot = {
    ...input.results,
    updatedAt: event.timestamp,
  };

  const stage = event.data.stage;
  const entry = activityFromEvent(event);
  if (entry) {
    job = {
      ...job,
      activity: [...job.activity, entry].slice(-40),
    };
  }

  switch (event.type) {
    case "job_queued":
      job = {
        ...job,
        status: "queued",
        operationMessage: "Queued…",
      };
      break;
    case "job_started":
      job = {
        ...job,
        status: "running",
        connection: "connected",
        operationMessage: "Scraping started…",
      };
      results = {
        ...results,
        status: "collecting",
      };
      break;
    case "stage_started": {
      if (!isStageId(stage)) {
        break;
      }
      const stages = { ...job.stages };
      for (const key of Object.keys(stages) as PipelineStageId[]) {
        if (stages[key] === "active") {
          stages[key] = "completed";
        }
      }
      stages[stage] = "active";
      const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stage);
      job = {
        ...job,
        status: job.status === "cancelling" ? "cancelling" : "running",
        currentStage: stage,
        stages,
        progress: {
          mode: "stage",
          percent: Math.round((stageIndex / PIPELINE_STAGES.length) * 1000) / 10,
          stageIndex: Math.max(0, stageIndex),
          stageCount: PIPELINE_STAGES.length,
        },
        operationMessage: `Running ${stage.replaceAll("_", " ")}…`,
      };
      break;
    }
    case "stage_completed": {
      if (!isStageId(stage)) {
        break;
      }
      job = {
        ...job,
        stages: { ...job.stages, [stage]: "completed" },
      };
      break;
    }
    case "stage_progress": {
      const stored =
        typeof event.data.stored === "number"
          ? event.data.stored
          : job.targetProgress.collected;
      const emails =
        typeof event.data.emails === "number"
          ? event.data.emails
          : job.stats.emailsFound;
      job = {
        ...job,
        stats: {
          ...job.stats,
          businessesFound: Math.max(job.stats.businessesFound, stored),
          emailsFound: Math.max(job.stats.emailsFound, emails),
        },
        targetProgress: {
          collected: stored,
          target: job.config.target,
        },
        operationMessage: event.data.stage_label ?? job.operationMessage,
      };
      break;
    }
    case "business_found": {
      const count =
        typeof event.data.count === "number"
          ? event.data.count
          : job.stats.businessesFound;
      job = {
        ...job,
        stats: {
          ...job.stats,
          businessesFound: count,
          localMatches:
            typeof event.data.kept === "number"
              ? event.data.kept
              : Math.max(job.stats.localMatches, count),
        },
        targetProgress: {
          collected: count,
          target: job.config.target,
        },
      };
      break;
    }
    case "website_found": {
      if (typeof event.data.count === "number") {
        job = {
          ...job,
          stats: { ...job.stats, websitesResolved: event.data.count },
        };
      }
      break;
    }
    case "email_found": {
      if (typeof event.data.count === "number") {
        job = {
          ...job,
          stats: { ...job.stats, emailsFound: event.data.count },
        };
      }
      break;
    }
    case "phone_found": {
      if (typeof event.data.count === "number") {
        job = {
          ...job,
          stats: { ...job.stats, phonesFound: event.data.count },
        };
      }
      break;
    }
    case "deduplicated": {
      if (typeof event.data.removed === "number") {
        job = {
          ...job,
          stats: { ...job.stats, duplicatesRemoved: event.data.removed },
        };
        results = {
          ...results,
          duplicatesRemoved: event.data.removed,
          summary: {
            ...results.summary,
            duplicates: event.data.removed,
          },
        };
      }
      break;
    }
    case "results_updated": {
      const incoming = Array.isArray(event.data.records)
        ? event.data.records
        : [];
      const records = mergeRecords(results.records, incoming);
      const duplicatesRemoved = results.duplicatesRemoved;
      results = {
        ...results,
        status: "collecting",
        records,
        summary: deriveResultSummary(records, duplicatesRemoved),
        duplicatesRemoved,
      };
      job = {
        ...job,
        targetProgress: {
          collected: records.length || job.targetProgress.collected,
          target: job.config.target,
        },
      };
      break;
    }
    case "csv_ready":
      job = { ...job, csvReady: true };
      break;
    case "job_completed": {
      const incoming = Array.isArray(event.data.records)
        ? event.data.records
        : results.records;
      const records = mergeRecords(results.records, incoming);
      results = {
        ...results,
        status: records.length ? "ready" : "empty",
        records,
        summary: deriveResultSummary(records, results.duplicatesRemoved),
      };
      job = {
        ...job,
        status: "completed",
        currentStage: null,
        stages: {
          discover: "completed",
          website_lookup: "completed",
          enrich: "completed",
          deduplicate: "completed",
          export: "completed",
        },
        progress: {
          mode: "stage",
          percent: 100,
          stageIndex: PIPELINE_STAGES.length,
          stageCount: PIPELINE_STAGES.length,
        },
        csvReady: true,
        error: null,
        operationMessage: "Scrape complete.",
        connection: "connected",
        stats: {
          ...job.stats,
          businessesFound: Math.max(job.stats.businessesFound, records.length),
        },
        targetProgress: {
          collected: records.length,
          target: job.config.target,
        },
      };
      break;
    }
    case "job_failed":
      job = {
        ...job,
        status: "failed",
        operationMessage:
          results.records.length > 0
            ? "Partial results available."
            : "Scraping failed.",
        partialResults: results.records.length > 0,
        csvReady: results.records.length > 0,
        error: {
          code: event.data.code ?? "SCRAPE_FAILED",
          message:
            event.data.message ??
            "Scraping failed. Check the server logs for details.",
          stage: isStageId(event.data.stage) ? event.data.stage : undefined,
          retryable: event.data.retryable !== false,
          details: event.data as Record<string, unknown>,
        },
      };
      if (results.records.length) {
        results = {
          ...results,
          status: "ready",
          summary: deriveResultSummary(
            results.records,
            results.duplicatesRemoved,
          ),
        };
      }
      break;
    case "job_cancelled":
      job = {
        ...job,
        status: "cancelled",
        currentStage: null,
        csvReady: results.records.length > 0,
        partialResults: results.records.length > 0,
        operationMessage: "Scraping cancelled.",
      };
      results = {
        ...results,
        status: results.records.length ? "ready" : "empty",
        summary: deriveResultSummary(
          results.records,
          results.duplicatesRemoved,
        ),
      };
      break;
    default:
      break;
  }

  if (isTerminalScrapeEvent(event.type) && job.status === "completed") {
    // ensure stages complete
    job = {
      ...job,
      stages: {
        discover: "completed",
        website_lookup: "completed",
        enrich: "completed",
        deduplicate: "completed",
        export: "completed",
      },
    };
  }

  return { job, results, appliedEventIds, changed: true };
}

export function applyScrapeEvents(
  input: EventReduceInput,
  events: ScrapeEvent[],
): EventReduceOutput {
  let current: EventReduceOutput = { ...input, changed: false };
  for (const event of events) {
    const next = applyScrapeEvent(current, event);
    current = {
      ...next,
      changed: current.changed || next.changed,
    };
  }
  return current;
}

export function createEmptyResultsForJob(jobId: string): ScrapeResultsSnapshot {
  return {
    jobId,
    status: "idle",
    records: [],
    summary: deriveResultSummary([]),
    duplicatesRemoved: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Test helper - blank job shell. */
export function createBlankJobShell(
  jobId: string,
  partial?: Partial<ScrapeJobSnapshot>,
): ScrapeJobSnapshot {
  const now = new Date().toISOString();
  return {
    id: jobId,
    provider: "remote",
    config: {
      businessType: "cafe",
      country: "USA",
      state: "NY",
      city: "New York",
      area: "",
      target: 20,
      sources: ["gmaps"],
      searchAllLocalities: false,
    },
    request: {
      niche: "cafe",
      country: "USA",
      state: "NY",
      city: "New York",
      targetCount: 20,
      sources: ["gmaps"],
      searchAllLocalities: false,
    },
    status: "queued",
    connection: "connected",
    currentStage: null,
    stages: createInitialStages(),
    progress: {
      mode: "stage",
      percent: 0,
      stageIndex: 0,
      stageCount: PIPELINE_STAGES.length,
    },
    targetProgress: { collected: 0, target: 20 },
    stats: createEmptyStats(),
    activity: [],
    operationMessage: "Queued…",
    csvReady: false,
    error: null,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

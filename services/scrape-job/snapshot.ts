import { toScrapeJobRequest } from "@/types/scrape";
import type { ScrapeConfig } from "@/types/scrape";
import {
  createEmptyStats,
  createInitialStages,
  PIPELINE_STAGES,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";

export function createJobSnapshotFromConfig(
  config: ScrapeConfig,
  options?: { id?: string; provider?: ScrapeJobSnapshot["provider"] },
): ScrapeJobSnapshot {
  const now = new Date().toISOString();
  const id =
    options?.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `job-${Date.now()}`);

  return {
    id,
    provider: options?.provider ?? "mock",
    config,
    request: toScrapeJobRequest(config),
    status: "idle",
    connection: "connected",
    currentStage: null,
    stages: createInitialStages(),
    progress: {
      mode: "stage",
      percent: 0,
      stageIndex: 0,
      stageCount: PIPELINE_STAGES.length,
    },
    targetProgress: {
      collected: 0,
      target: config.target,
    },
    stats: createEmptyStats(),
    activity: [],
    operationMessage: "Waiting to start…",
    csvReady: false,
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function formatJobLocation(config: ScrapeConfig): string {
  const parts = [config.area, config.city, config.state, config.country]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.join(", ");
}

export function stageNumber(stageId: string | null): number {
  if (!stageId) {
    return 0;
  }
  const index = PIPELINE_STAGES.findIndex((stage) => stage.id === stageId);
  return index >= 0 ? index + 1 : 0;
}

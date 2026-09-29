import { SESSION_JOB_KEY_PREFIX } from "@/lib/scrape/constants";
import type { ScrapeJobProvider } from "@/services/scrape-job/provider";
import {
  PIPELINE_STAGES,
  isTerminalJobStatus,
  type JobActivityEntry,
  type PipelineStageId,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";

const STORAGE_PREFIX = `${SESSION_JOB_KEY_PREFIX}snapshot:`;

type MockRuntime = {
  timers: Array<ReturnType<typeof setTimeout>>;
  step: number;
};

/**
 * Development-only job driver.
 * Finite scripted transitions - not a live scrape and not production data.
 */
class MockScrapeJobProvider implements ScrapeJobProvider {
  readonly kind = "mock" as const;

  private readonly jobs = new Map<string, ScrapeJobSnapshot>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly runtimes = new Map<string, MockRuntime>();

  getJob(jobId: string): ScrapeJobSnapshot | null {
    const cached = this.jobs.get(jobId);
    if (cached) {
      return cached;
    }

    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(storageKey(jobId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ScrapeJobSnapshot;
      if (!parsed?.id || !parsed?.config) {
        return null;
      }
      this.jobs.set(jobId, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  saveJob(snapshot: ScrapeJobSnapshot): void {
    const next = { ...snapshot, updatedAt: new Date().toISOString() };
    this.jobs.set(snapshot.id, next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey(snapshot.id), JSON.stringify(next));
    }
    this.emit(snapshot.id);
  }

  startJob(jobId: string): void {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status)) {
      return;
    }

    if (this.runtimes.has(jobId)) {
      return;
    }

    if (job.status === "idle" || job.status === "starting") {
      this.patch(jobId, {
        status: "starting",
        connection: "connected",
        operationMessage: "Starting scrape pipeline…",
        activity: [
          ...job.activity,
          activity("Job accepted (development mock - not a live Python scrape)"),
        ].slice(-40),
      });
    }

    this.runScript(jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status)) {
      return;
    }

    this.clearTimers(jobId);
    this.patch(jobId, {
      status: "cancelling",
      operationMessage: "Stopping scrape…",
      activity: [
        ...job.activity,
        activity("Cancel requested - mock provider stopping local simulation"),
      ].slice(-40),
    });

    await wait(350);

    const current = this.getJob(jobId);
    if (!current || current.status !== "cancelling") {
      return;
    }

    this.patch(jobId, {
      status: "cancelled",
      currentStage: null,
      operationMessage: "Scraping cancelled.",
      progress: {
        ...current.progress,
        mode: "stage",
      },
      activity: [
        ...current.activity,
        activity("Job cancelled (mock - no Python process was stopped)"),
      ].slice(-40),
    });
  }

  simulateConnectionInterrupt(jobId: string): void {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status)) {
      return;
    }

    this.clearTimers(jobId);
    this.patch(jobId, {
      connection: "interrupted",
      operationMessage: "Connection to scraper interrupted…",
      activity: [
        ...job.activity,
        activity("Connection interrupted (mock transport)"),
      ].slice(-40),
    });

    const timer = setTimeout(() => {
      const current = this.getJob(jobId);
      if (!current || isTerminalJobStatus(current.status)) {
        return;
      }
      this.patch(jobId, {
        connection: "reconnecting",
        operationMessage: "We're trying to reconnect to the scraping job…",
      });

      const resume = setTimeout(() => {
        const latest = this.getJob(jobId);
        if (!latest || isTerminalJobStatus(latest.status)) {
          return;
        }
        this.patch(jobId, {
          connection: "connected",
          operationMessage:
            latest.currentStage
              ? stageDescription(latest.currentStage)
              : "Reconnected. Resuming…",
          activity: [
            ...latest.activity,
            activity("Connection restored (mock transport)"),
          ].slice(-40),
        });
        this.runScript(jobId);
      }, 900);

      this.trackTimer(jobId, resume);
    }, 700);

    this.trackTimer(jobId, timer);
  }

  simulateFailure(jobId: string): void {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status)) {
      return;
    }

    this.clearTimers(jobId);
    const stage = job.currentStage ?? "enrich";
    this.patch(jobId, {
      status: "failed",
      connection: "connected",
      stages: {
        ...job.stages,
        [stage]: "failed",
      },
      operationMessage: "Scraping couldn't complete.",
      error: {
        code: "MOCK_STAGE_FAILURE",
        message: "The job stopped during website enrichment.",
        stage,
        retryable: true,
        details:
          "Development mock failure. No Python process or network scrape was running.",
      },
      activity: [
        ...job.activity,
        activity("Job failed (mock failure injected for UI testing)"),
      ].slice(-40),
    });
  }

  subscribe(jobId: string, listener: () => void): () => void {
    const set = this.listeners.get(jobId) ?? new Set();
    set.add(listener);
    this.listeners.set(jobId, set);
    return () => {
      set.delete(listener);
    };
  }

  private runScript(jobId: string): void {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status) || job.status === "cancelling") {
      return;
    }

    this.clearTimers(jobId);
    const runtime: MockRuntime = { timers: [], step: 0 };
    this.runtimes.set(jobId, runtime);

    const niche = job.config.businessType;
    const location = job.config.area?.trim()
      ? `${job.config.area}, ${job.config.city}`
      : job.config.city;
    const target = job.config.target;

    type ScriptStep =
      | { at: number; apply: (snapshot: ScrapeJobSnapshot) => Partial<ScrapeJobSnapshot> };

    const steps: ScriptStep[] = [
      {
        at: 400,
        apply: (s) => ({
          status: "running",
          currentStage: "discover",
          stages: stageMap("discover", "active"),
          progress: progress(1, 12),
          operationMessage: "Searching local business listings…",
          activity: append(
            s,
            activity(`Discovering ${niche} in ${location}`),
          ),
        }),
      },
      {
        at: 1100,
        apply: (s) => ({
          stats: { ...s.stats, businessesFound: Math.min(12, target + 8) },
          progress: progress(1, 24),
          activity: append(s, activity("Found 12 businesses")),
        }),
      },
      {
        at: 1800,
        apply: (s) => ({
          stats: {
            ...s.stats,
            businessesFound: Math.min(18, target + 12),
          },
          progress: progress(1, 36),
          operationMessage: "Filtering results by locality…",
          activity: append(s, activity("Applying locality filter")),
        }),
      },
      {
        at: 2400,
        apply: (s) => {
          const matches = Math.min(target, Math.max(8, Math.floor(target * 0.7)));
          return {
            stats: { ...s.stats, localMatches: matches },
            targetProgress: { collected: matches, target },
            progress: progress(1, 48),
            stages: stageMap("discover", "completed"),
            activity: append(s, activity(`${matches} businesses matched`)),
          };
        },
      },
      {
        at: 2900,
        apply: (s) => ({
          currentStage: "website_lookup",
          stages: {
            ...stageMap("discover", "completed"),
            website_lookup: "active",
          },
          progress: progress(2, 55),
          operationMessage: "Looking for official websites…",
          activity: append(s, activity("Resolving missing websites")),
        }),
      },
      {
        at: 3600,
        apply: (s) => {
          const sites = Math.min(
            s.stats.localMatches || target,
            Math.max(5, Math.floor((s.stats.localMatches || target) * 0.8)),
          );
          return {
            stats: { ...s.stats, websitesResolved: sites },
            progress: progress(2, 62),
            stages: {
              ...s.stages,
              website_lookup: "completed",
            },
            activity: append(s, activity(`${sites} websites resolved`)),
          };
        },
      },
      {
        at: 4100,
        apply: (s) => ({
          currentStage: "enrich",
          stages: { ...s.stages, enrich: "active" },
          progress: progress(3, 70),
          operationMessage:
            "Extracting publicly available contact information…",
          activity: append(s, activity("Crawling public company sites")),
        }),
      },
      {
        at: 5000,
        apply: (s) => {
          const emails = Math.max(
            3,
            Math.floor((s.stats.websitesResolved || 1) * 0.75),
          );
          const phones = Math.max(
            4,
            Math.floor((s.stats.localMatches || target) * 0.85),
          );
          return {
            stats: { ...s.stats, emailsFound: emails, phonesFound: phones },
            progress: progress(3, 82),
            stages: { ...s.stages, enrich: "completed" },
            activity: append(
              s,
              activity(`${emails} public emails · ${phones} phones`),
            ),
          };
        },
      },
      {
        at: 5500,
        apply: (s) => ({
          currentStage: "deduplicate",
          stages: { ...s.stages, deduplicate: "active" },
          progress: progress(4, 88),
          operationMessage: "Removing duplicate businesses…",
          activity: append(s, activity("Merging duplicate listings")),
        }),
      },
      {
        at: 6100,
        apply: (s) => {
          const removed = Math.max(1, Math.floor(s.stats.businessesFound * 0.1));
          const collected = Math.min(
            target,
            Math.max(s.targetProgress.collected, s.stats.localMatches - removed),
          );
          return {
            stats: { ...s.stats, duplicatesRemoved: removed },
            targetProgress: { collected, target },
            progress: progress(4, 93),
            stages: { ...s.stages, deduplicate: "completed" },
            activity: append(s, activity(`${removed} duplicates removed`)),
          };
        },
      },
      {
        at: 6600,
        apply: (s) => ({
          currentStage: "export",
          stages: { ...s.stages, export: "active" },
          progress: progress(5, 97),
          operationMessage: "Preparing your CSV…",
          activity: append(s, activity("Normalizing columns for CSV export")),
        }),
      },
      {
        at: 7200,
        apply: (s) => ({
          status: "completed",
          currentStage: "export",
          stages: { ...s.stages, export: "completed" },
          progress: progress(5, 100),
          csvReady: false,
          operationMessage: "Scraping completed.",
          activity: append(
            s,
            activity(
              "Export ready in UI (CSV download arrives in a later milestone)",
            ),
          ),
        }),
      },
    ];

    for (const step of steps) {
      const timer = setTimeout(() => {
        const current = this.getJob(jobId);
        if (
          !current ||
          isTerminalJobStatus(current.status) ||
          current.status === "cancelling" ||
          current.connection === "interrupted" ||
          current.connection === "reconnecting"
        ) {
          return;
        }

        const patch = step.apply(current);
        this.patch(jobId, {
          ...patch,
          activity: patch.activity ?? current.activity,
          status: patch.status ?? "running",
        });

        const latest = this.getJob(jobId);
        if (latest) {
          void import("@/services/scrape-results").then((results) => {
            results.setScrapeResultsDuplicates(
              jobId,
              latest.stats.duplicatesRemoved,
            );
            if (latest.status === "completed") {
              results.markScrapeResultsReady(jobId);
            }
          });
        }
      }, step.at);

      this.trackTimer(jobId, timer);
    }
  }

  private patch(jobId: string, partial: Partial<ScrapeJobSnapshot>): void {
    const current = this.getJob(jobId);
    if (!current) {
      return;
    }
    this.saveJob({ ...current, ...partial, id: current.id });
  }

  private emit(jobId: string): void {
    const set = this.listeners.get(jobId);
    if (!set) {
      return;
    }
    for (const listener of set) {
      listener();
    }
  }

  private trackTimer(jobId: string, timer: ReturnType<typeof setTimeout>): void {
    const runtime = this.runtimes.get(jobId) ?? { timers: [], step: 0 };
    runtime.timers.push(timer);
    this.runtimes.set(jobId, runtime);
  }

  private clearTimers(jobId: string): void {
    const runtime = this.runtimes.get(jobId);
    if (!runtime) {
      return;
    }
    for (const timer of runtime.timers) {
      clearTimeout(timer);
    }
    this.runtimes.delete(jobId);
  }
}

function storageKey(jobId: string): string {
  return `${STORAGE_PREFIX}${jobId}`;
}

function activity(message: string, stage?: PipelineStageId): JobActivityEntry {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    stage,
    message,
  };
}

function append(
  snapshot: ScrapeJobSnapshot,
  entry: JobActivityEntry,
): JobActivityEntry[] {
  return [...snapshot.activity, entry].slice(-40);
}

function stageMap(
  activeOrCompleted: PipelineStageId,
  status: "active" | "completed",
): ScrapeJobSnapshot["stages"] {
  const stages = {
    discover: "pending",
    website_lookup: "pending",
    enrich: "pending",
    deduplicate: "pending",
    export: "pending",
  } as ScrapeJobSnapshot["stages"];

  for (const stage of PIPELINE_STAGES) {
    if (stage.id === activeOrCompleted) {
      stages[stage.id] = status;
      break;
    }
    stages[stage.id] = "completed";
  }

  return stages;
}

function progress(stageIndex: number, percent: number) {
  return {
    mode: "percent" as const,
    percent,
    stageIndex,
    stageCount: PIPELINE_STAGES.length,
  };
}

function stageDescription(stageId: PipelineStageId): string {
  return (
    PIPELINE_STAGES.find((stage) => stage.id === stageId)?.description ??
    "Working…"
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let mockProviderSingleton: MockScrapeJobProvider | null = null;

export function getMockScrapeJobProvider(): MockScrapeJobProvider {
  if (!mockProviderSingleton) {
    mockProviderSingleton = new MockScrapeJobProvider();
  }
  return mockProviderSingleton;
}

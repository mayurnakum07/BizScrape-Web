/**
 * IndexedDB persistence for completed scrape result sets.
 * Browser-only — never imported from server components without a client boundary.
 *
 * Connection is cached; list views use a cursor so full record arrays are not
 * retained for every row in the history workspace.
 */

import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";
import type { ResultSummary } from "@/types/scrape-results";

const DB_NAME = "bizscrape-history";
const DB_VERSION = 1;
const STORE_NAME = "scrapes";

export type StoredScrapeStatus = "completed" | "partial" | "cancelled";

export type StoredScrape = {
  id: string;
  jobId: string;
  savedAt: string;
  config: ScrapeConfig;
  summary: ResultSummary;
  records: BusinessRecord[];
  status: StoredScrapeStatus;
  /** Cached once at write time for list UIs (avoids re-scanning records). */
  durationMs?: number | null;
};

/** Lightweight list row — no `records` payload. */
export type StoredScrapeSummary = Omit<StoredScrape, "records"> & {
  recordCount: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("Failed to open scrape history database."));
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("savedAt", "savedAt", { unique: false });
        store.createIndex("jobId", "jobId", { unique: false });
      }
    };
  });

  return dbPromise;
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = run(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("IndexedDB request failed."));
        tx.onerror = () => {
          reject(tx.error ?? new Error("IndexedDB transaction failed."));
        };
      }),
  );
}

function estimateDurationMs(records: BusinessRecord[]): number | null {
  const stamps: number[] = [];
  for (const record of records) {
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

function toSummary(entry: StoredScrape): StoredScrapeSummary {
  return {
    id: entry.id,
    jobId: entry.jobId,
    savedAt: entry.savedAt,
    config: entry.config,
    summary: entry.summary,
    status: entry.status,
    durationMs: entry.durationMs ?? estimateDurationMs(entry.records),
    recordCount: entry.records.length,
  };
}

export async function saveStoredScrape(
  entry: StoredScrape,
): Promise<StoredScrape> {
  await withStore("readwrite", (store) => store.put(entry));
  return entry;
}

/** Full payloads — prefer `listStoredScrapeSummaries` for history lists. */
export async function listStoredScrapes(): Promise<StoredScrape[]> {
  const rows = await withStore("readonly", (store) => store.getAll());
  return [...rows].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * History workspace list — cursor walk keeps only metadata in the result array.
 */
export async function listStoredScrapeSummaries(): Promise<StoredScrapeSummary[]> {
  const db = await openDb();
  return new Promise<StoredScrapeSummary[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    const rows: StoredScrapeSummary[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
        resolve(rows);
        return;
      }
      rows.push(toSummary(cursor.value as StoredScrape));
      cursor.continue();
    };
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB cursor failed."));
    tx.onerror = () => {
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

export async function getStoredScrape(
  id: string,
): Promise<StoredScrape | null> {
  const row = await withStore("readonly", (store) => store.get(id));
  return row ?? null;
}

export async function deleteStoredScrape(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function upsertScrapeFromJob(input: {
  jobId: string;
  config: ScrapeConfig;
  records: BusinessRecord[];
  summary: ResultSummary;
  status: StoredScrapeStatus;
}): Promise<StoredScrape> {
  const db = await openDb();
  return new Promise<StoredScrape>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(input.jobId);

    getReq.onsuccess = () => {
      const existing = (getReq.result as StoredScrape | undefined) ?? null;
      const entry: StoredScrape = {
        id: input.jobId,
        jobId: input.jobId,
        savedAt: existing?.savedAt ?? new Date().toISOString(),
        config: input.config,
        records: input.records,
        summary: input.summary,
        status: input.status,
        durationMs: estimateDurationMs(input.records),
      };
      if (!existing || existing.records.length !== input.records.length) {
        entry.savedAt = new Date().toISOString();
      }
      const putReq = store.put(entry);
      putReq.onsuccess = () => resolve(entry);
      putReq.onerror = () =>
        reject(putReq.error ?? new Error("IndexedDB put failed."));
    };
    getReq.onerror = () =>
      reject(getReq.error ?? new Error("IndexedDB get failed."));
    tx.onerror = () => {
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

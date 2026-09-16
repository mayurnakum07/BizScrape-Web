/**
 * IndexedDB persistence for completed scrape result sets.
 * Browser-only — never imported from server components without a client boundary.
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
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open scrape history database."));
    };
    request.onsuccess = () => {
      resolve(request.result);
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
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed."));
        };
      }),
  );
}

export async function saveStoredScrape(
  entry: StoredScrape,
): Promise<StoredScrape> {
  await withStore("readwrite", (store) => store.put(entry));
  return entry;
}

export async function listStoredScrapes(): Promise<StoredScrape[]> {
  const rows = await withStore("readonly", (store) => store.getAll());
  return [...rows].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
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
  const existing = await getStoredScrape(input.jobId);
  const entry: StoredScrape = {
    id: input.jobId,
    jobId: input.jobId,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
    config: input.config,
    records: input.records,
    summary: input.summary,
    status: input.status,
  };
  // Refresh savedAt when records grow so newest complete scrapes float up.
  if (!existing || existing.records.length !== input.records.length) {
    entry.savedAt = new Date().toISOString();
  }
  return saveStoredScrape(entry);
}

"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteStoredScrape,
  getStoredScrape,
  listStoredScrapeSummaries,
  type StoredScrape,
  type StoredScrapeSummary,
} from "@/services/scrape-history/idb";

export function useScrapeHistoryList() {
  const [items, setItems] = useState<StoredScrapeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listStoredScrapeSummaries();
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load scrape history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteStoredScrape(id);
    setItems((current) => current.filter((row) => row.id !== id));
  }, []);

  return { items, loading, error, refresh, remove };
}

export function useStoredScrape(id: string) {
  const [item, setItem] = useState<StoredScrape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getStoredScrape(id)
      .then((row) => {
        if (!cancelled) {
          setItem(row);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load this scrape.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { item, loading, error };
}

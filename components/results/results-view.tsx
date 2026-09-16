"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";

import {
  filterAndSortRecords,
  uniqueSorted,
} from "@/components/results/filter-records";
import { ResultDetailsDialog } from "@/components/results/result-details-dialog";
import { ResultsCards } from "@/components/results/results-cards";
import { ResultsEmpty, ResultsLoadingRows } from "@/components/results/results-empty";
import { ResultsExportActions } from "@/components/results/results-export-actions";
import { ResultsHeader } from "@/components/results/results-header";
import { ResultsSummary } from "@/components/results/results-summary";
import {
  ResultsToolbar,
  type ResultsFilters,
} from "@/components/results/results-toolbar";
import { ResultsTable } from "@/components/results/results-table";
import { Button } from "@/components/ui/button";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

const PAGE_SIZE = 20;

type ResultsViewProps = {
  job: ScrapeJobSnapshot;
  results: ScrapeResultsSnapshot;
};

export function ResultsView({ job, results }: ResultsViewProps) {
  const [filters, setFilters] = useState<ResultsFilters>({
    query: "",
    area: "",
    category: "",
    hasWebsite: false,
    hasEmail: false,
    hasPhone: false,
    sort: "company_name",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const deferredQuery = useDeferredValue(filters.query);
  const derivedFilters = useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [deferredQuery, filters],
  );

  const areas = useMemo(
    () => uniqueSorted(results.records.map((record) => record.area)),
    [results.records],
  );
  const categories = useMemo(
    () => uniqueSorted(results.records.map((record) => record.category)),
    [results.records],
  );

  const filtered = useMemo(
    () => filterAndSortRecords(results.records, derivedFilters),
    [derivedFilters, results.records],
  );
  const visibleCount = filtered.length;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const showLoadingSkeleton =
    results.status === "collecting" && results.records.length === 0;
  const handleFiltersChange = useCallback((next: ResultsFilters) => {
    setFilters(next);
    setPage(1);
  }, []);
  const handleSelect = useCallback((record: BusinessRecord) => {
    setSelected(record);
  }, []);
  const handleCloseDetails = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ResultsHeader job={job} results={results} />
      <ResultsSummary summary={results.summary} />

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">Export</h2>
            <p className="mt-1 text-small">
              {job.config.businessType} · {job.config.city}
              {job.config.area?.trim() ? ` · ${job.config.area}` : ""}
              <span className="mx-2 text-border">·</span>
              {results.summary.businesses} records
            </p>
          </div>
          <ResultsExportActions
            records={results.records}
            config={job.config}
            className="sm:items-end"
          />
        </div>
      </div>

      <ResultsToolbar
        filters={filters}
        areas={areas}
        categories={categories}
        total={results.summary.businesses}
        visible={visibleCount}
        onChange={handleFiltersChange}
      />

      {showLoadingSkeleton ? <ResultsLoadingRows /> : null}

      {paged.length === 0 && !showLoadingSkeleton ? (
        <ResultsEmpty
          status={results.status}
          filteredEmpty={results.records.length > 0}
        />
      ) : null}

      {paged.length > 0 ? (
        <>
          <ResultsTable records={paged} onSelect={handleSelect} />
          <ResultsCards records={paged} onSelect={handleSelect} />
        </>
      ) : null}

      {filtered.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted">
            Page {safePage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={safePage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ResultDetailsDialog
        record={selected}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

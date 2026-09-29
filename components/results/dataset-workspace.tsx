"use client";

import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { filterAndSortRecords } from "@/components/results/filter-records";
import { ResultDetailsDrawer } from "@/components/results/result-details-drawer";
import { ResultsCards } from "@/components/results/results-cards";
import {
  ResultsEmpty,
  ResultsLoadingRows,
} from "@/components/results/results-empty";
import { ResultsPagination } from "@/components/results/results-pagination";
import { ResultsSelectionBar } from "@/components/results/results-selection-bar";
import {
  DEFAULT_DENSITY,
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  type ResultsColumnId,
  type ResultsDensity,
  type ResultsPageSize,
} from "@/components/results/results-columns";
import {
  ResultsToolbar,
  type ResultsFilters,
} from "@/components/results/results-toolbar";
import { ResultsTable } from "@/components/results/results-table";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";
import type { ResultsCollectionStatus } from "@/types/scrape-results";

export type DatasetWorkspaceProps = {
  records: BusinessRecord[];
  totalCount: number;
  config: Pick<ScrapeConfig, "city" | "businessType" | "area">;
  /** Maps onto ResultsEmpty / loading skeleton behavior. */
  collectionStatus?: ResultsCollectionStatus;
  emptyVariant?: "live" | "saved";
  /** Extra export help when the dataset is local/persisted. */
  exportFilteredHint?: string;
  ariaLabel?: string;
};

function collectFacets(records: BusinessRecord[]): {
  areas: string[];
  categories: string[];
} {
  const areaSet = new Set<string>();
  const categorySet = new Set<string>();
  for (const record of records) {
    const area = record.area.trim();
    if (area) {
      areaSet.add(area);
    }
    const category = record.category.trim();
    if (category) {
      categorySet.add(category);
    }
  }
  const collator = (a: string, b: string) => a.localeCompare(b);
  return {
    areas: Array.from(areaSet).sort(collator),
    categories: Array.from(categorySet).sort(collator),
  };
}

/**
 * Shared M6 data workspace — search, filters, sort, columns, density,
 * selection, pagination, and the M7 detail drawer.
 */
function DatasetWorkspaceComponent({
  records,
  totalCount,
  config,
  collectionStatus = "ready",
  emptyVariant = "live",
  exportFilteredHint,
  ariaLabel = "Results data workspace",
}: DatasetWorkspaceProps) {
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
  const [pageSize, setPageSize] = useState<ResultsPageSize>(DEFAULT_PAGE_SIZE);
  const [density, setDensity] = useState<ResultsDensity>(DEFAULT_DENSITY);
  const [visibleColumns, setVisibleColumns] = useState<ResultsColumnId[]>(
    () => [...DEFAULT_VISIBLE_COLUMNS],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const deferredQuery = useDeferredValue(filters.query);
  const derivedFilters = useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [deferredQuery, filters],
  );

  const { areas, categories } = useMemo(
    () => collectFacets(records),
    [records],
  );

  const filtered = useMemo(
    () => filterAndSortRecords(records, derivedFilters),
    [derivedFilters, records],
  );
  const visibleCount = filtered.length;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : pageStart + 1;
  const rangeTo = Math.min(pageStart + pageSize, filtered.length);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.has(record.id)),
    [records, selectedIds],
  );
  const pageSelected =
    paged.length > 0 && paged.every((record) => selectedIds.has(record.id));

  const showLoadingSkeleton =
    collectionStatus === "collecting" && records.length === 0;

  const handleFiltersChange = useCallback((next: ResultsFilters) => {
    startTransition(() => {
      setFilters(next);
      setPage(1);
    });
  }, []);

  const handleSortChange = useCallback((sort: ResultsFilters["sort"]) => {
    startTransition(() => {
      setFilters((current) => ({ ...current, sort }));
      setPage(1);
    });
  }, []);

  const handlePageSizeChange = useCallback((size: ResultsPageSize) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const handleSelect = useCallback((record: BusinessRecord) => {
    setSelected(record);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelected(null);
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAllPage = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = paged.every((record) => next.has(record.id));
      if (allSelected) {
        for (const record of paged) {
          next.delete(record.id);
        }
      } else {
        for (const record of paged) {
          next.add(record.id);
        }
      }
      return next;
    });
  }, [paged]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectPage = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const record of paged) {
        next.add(record.id);
      }
      return next;
    });
  }, [paged]);

  return (
    <>
      <section
        aria-label={ariaLabel}
        className="results-workspace overflow-hidden border border-border bg-surface"
      >
        <ResultsToolbar
          filters={filters}
          areas={areas}
          categories={categories}
          total={totalCount}
          visible={visibleCount}
          onChange={handleFiltersChange}
          density={density}
          onDensityChange={setDensity}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          exportRecords={records}
          exportConfig={config}
          filteredCount={visibleCount}
          filteredHint={exportFilteredHint}
        />

        <ResultsSelectionBar
          selectedCount={selectedIds.size}
          selectedRecords={selectedRecords}
          config={config}
          onClear={handleClearSelection}
          onSelectPage={handleSelectPage}
          pageCount={paged.length}
          pageSelected={pageSelected}
        />

        {showLoadingSkeleton ? <ResultsLoadingRows /> : null}

        {paged.length === 0 && !showLoadingSkeleton ? (
          <ResultsEmpty
            status={collectionStatus}
            filteredEmpty={records.length > 0}
            variant={emptyVariant}
            actions={
              records.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleFiltersChange({
                      ...filters,
                      query: "",
                      area: "",
                      category: "",
                      hasWebsite: false,
                      hasEmail: false,
                      hasPhone: false,
                    })
                  }
                >
                  Clear search and filters
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {paged.length > 0 ? (
          <>
            <ResultsTable
              records={paged}
              onSelect={handleSelect}
              density={density}
              visibleColumns={visibleColumns}
              sort={filters.sort}
              onSortChange={handleSortChange}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAllPage={handleToggleSelectAllPage}
              activeRecordId={selected?.id ?? null}
            />
            <ResultsCards
              records={paged}
              onSelect={handleSelect}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          </>
        ) : null}

        {filtered.length > 0 ? (
          <ResultsPagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={filtered.length}
            from={rangeFrom}
            to={rangeTo}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : null}
      </section>

      <ResultDetailsDrawer
        record={selected}
        records={filtered}
        onClose={handleCloseDetails}
        onSelect={handleSelect}
      />
    </>
  );
}

export const DatasetWorkspace = memo(DatasetWorkspaceComponent);

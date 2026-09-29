"use client";

import { useState } from "react";

import {
  activeFilterCount,
  hasActiveFilters,
} from "@/components/results/filter-utils";
import {
  DEFAULT_DENSITY,
  DEFAULT_VISIBLE_COLUMNS,
  RESULTS_COLUMNS,
  type ResultsColumnId,
  type ResultsDensity,
  toggleColumnVisibility,
} from "@/components/results/results-columns";
import { ResultsExportActions } from "@/components/results/results-export-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";
import { cn } from "@/lib/cn";

export type ResultsSortKey = "company_name" | "rating" | "review_count";

export type ResultsFilters = {
  query: string;
  area: string;
  category: string;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  sort: ResultsSortKey;
};

type ResultsToolbarProps = {
  filters: ResultsFilters;
  areas: string[];
  categories: string[];
  onChange: (next: ResultsFilters) => void;
  total: number;
  visible: number;
  density: ResultsDensity;
  onDensityChange: (density: ResultsDensity) => void;
  visibleColumns: ResultsColumnId[];
  onVisibleColumnsChange: (columns: ResultsColumnId[]) => void;
  exportRecords: BusinessRecord[];
  exportConfig: Pick<ScrapeConfig, "city" | "businessType" | "area">;
  filteredCount: number;
  /** Optional override for export helper hint. */
  filteredHint?: string;
};

function FilterFields({
  filters,
  areas,
  categories,
  onChange,
}: Pick<ResultsToolbarProps, "filters" | "areas" | "categories" | "onChange">) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="field">
        <Label htmlFor="results-area">Area</Label>
        <Select
          id="results-area"
          value={filters.area}
          onChange={(event) =>
            onChange({ ...filters, area: event.target.value })
          }
        >
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </Select>
      </div>

      <div className="field">
        <Label htmlFor="results-category">Category</Label>
        <Select
          id="results-category"
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Coverage
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <label className="inline-flex min-h-9 items-center gap-2 text-muted">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={filters.hasWebsite}
              onChange={(event) =>
                onChange({ ...filters, hasWebsite: event.target.checked })
              }
            />
            Has website
          </label>
          <label className="inline-flex min-h-9 items-center gap-2 text-muted">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={filters.hasEmail}
              onChange={(event) =>
                onChange({ ...filters, hasEmail: event.target.checked })
              }
            />
            Has email
          </label>
          <label className="inline-flex min-h-9 items-center gap-2 text-muted">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={filters.hasPhone}
              onChange={(event) =>
                onChange({ ...filters, hasPhone: event.target.checked })
              }
            />
            Has phone
          </label>
        </div>
      </fieldset>
    </div>
  );
}

export function ResultsToolbar({
  filters,
  areas,
  categories,
  onChange,
  total,
  visible,
  density,
  onDensityChange,
  visibleColumns,
  onVisibleColumnsChange,
  exportRecords,
  exportConfig,
  filteredCount,
  filteredHint,
}: ResultsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const filterCount = activeFilterCount(filters);
  const exportingFiltered =
    filteredCount > 0 && filteredCount < exportRecords.length;
  const resolvedHint =
    filteredHint ??
    (exportingFiltered
      ? `Full export includes all ${exportRecords.length} records (filters apply to the table only).`
      : undefined);

  function clearFilters() {
    onChange({
      ...filters,
      query: filters.query,
      area: "",
      category: "",
      hasWebsite: false,
      hasEmail: false,
      hasPhone: false,
    });
  }

  return (
    <section aria-label="Result tools" className="results-toolbar">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-mono text-xs text-muted sm:pt-2">
            Showing{" "}
            <span className="text-foreground tabular-nums">{visible}</span> of{" "}
            <span className="tabular-nums">{total}</span>
            {filterCount > 0 ? (
              <span>
                {" "}
                · {filterCount} filter{filterCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>

          <ResultsExportActions
            records={exportRecords}
            config={exportConfig}
            size="sm"
            className="sm:items-end"
            compactHelp
            filteredHint={resolvedHint}
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="field min-w-0 flex-1">
            <Label htmlFor="results-search" className="sr-only">
              Search
            </Label>
            <Input
              id="results-search"
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              placeholder="Search company, website, email, phone, area…"
              autoComplete="off"
              className="h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
            >
              Filters
              {filterCount > 0 ? (
                <Badge variant="info" className="ml-2">
                  {filterCount}
                </Badge>
              ) : null}
            </Button>

            <div className="field min-w-[9.5rem]">
              <Label htmlFor="results-sort" className="sr-only">
                Sort
              </Label>
              <Select
                id="results-sort"
                value={filters.sort}
                className="h-9"
                onChange={(event) =>
                  onChange({
                    ...filters,
                    sort: event.target.value as ResultsSortKey,
                  })
                }
              >
                <option value="company_name">Sort: Company</option>
                <option value="rating">Sort: Rating</option>
                <option value="review_count">Sort: Reviews</option>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden min-h-10 md:inline-flex"
              aria-haspopup="dialog"
              aria-expanded={columnsOpen}
              onClick={() => setColumnsOpen(true)}
            >
              Columns
            </Button>

            <Dropdown
              label="Density"
              align="end"
              className="hidden md:inline-flex"
              trigger={
                <span className="text-sm">
                  {density === "compact" ? "Compact" : "Comfortable"}
                </span>
              }
              items={[
                {
                  id: "compact",
                  label: density === "compact" ? "✓ Compact" : "Compact",
                  onSelect: () => onDensityChange("compact"),
                },
                {
                  id: "comfortable",
                  label:
                    density === "comfortable" ? "✓ Comfortable" : "Comfortable",
                  onSelect: () => onDensityChange("comfortable"),
                },
                {
                  id: "reset-density",
                  label: "Reset density",
                  onSelect: () => onDensityChange(DEFAULT_DENSITY),
                },
              ]}
            />

            {hasActiveFilters(filters) || filters.query.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-10"
                onClick={() =>
                  onChange({
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
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <Dialog
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filter results"
          description="Narrow the dataset by area, category, or contact coverage."
          size="md"
        >
          <div className="flex flex-col gap-4">
            <FilterFields
              filters={filters}
              areas={areas}
              categories={categories}
              onChange={onChange}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {hasActiveFilters(filters) ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
              <Button type="button" onClick={() => setFiltersOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {columnsOpen ? (
        <Dialog
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          title="Visible columns"
          description="Company stays visible. Optional fields can be shown for denser review."
          size="md"
        >
          <div className="flex flex-col gap-3">
            {RESULTS_COLUMNS.map((column) => {
              const checked = visibleColumns.includes(column.id);
              const locked = column.id === "company";
              return (
                <label
                  key={column.id}
                  className={cn(
                    "flex min-h-10 items-center gap-3 border border-border-subtle px-3 py-2 text-sm",
                    locked && "opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={checked}
                    disabled={locked}
                    onChange={() =>
                      onVisibleColumnsChange(
                        toggleColumnVisibility(visibleColumns, column.id),
                      )
                    }
                  />
                  <span className="text-foreground">{column.label}</span>
                  {locked ? (
                    <span className="ml-auto font-mono text-xs text-muted uppercase">
                      Required
                    </span>
                  ) : null}
                </label>
              );
            })}
            <div className="flex justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onVisibleColumnsChange([...DEFAULT_VISIBLE_COLUMNS])
                }
              >
                Reset columns
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setColumnsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

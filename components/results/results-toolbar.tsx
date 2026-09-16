"use client";

import { useState } from "react";

import {
  activeFilterCount,
  hasActiveFilters,
} from "@/components/results/filter-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
};

function FilterFields({
  filters,
  areas,
  categories,
  onChange,
}: Pick<ResultsToolbarProps, "filters" | "areas" | "categories" | "onChange">) {
  return (
    <>
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

      <div className="flex flex-col gap-3 text-sm">
        <label className="inline-flex min-h-11 items-center gap-3 text-muted">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={filters.hasWebsite}
            onChange={(event) =>
              onChange({ ...filters, hasWebsite: event.target.checked })
            }
          />
          Has website
        </label>
        <label className="inline-flex min-h-11 items-center gap-3 text-muted">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={filters.hasEmail}
            onChange={(event) =>
              onChange({ ...filters, hasEmail: event.target.checked })
            }
          />
          Has email
        </label>
        <label className="inline-flex min-h-11 items-center gap-3 text-muted">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={filters.hasPhone}
            onChange={(event) =>
              onChange({ ...filters, hasPhone: event.target.checked })
            }
          />
          Has phone
        </label>
      </div>
    </>
  );
}

export function ResultsToolbar({
  filters,
  areas,
  categories,
  onChange,
  total,
  visible,
}: ResultsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = activeFilterCount(filters);

  function clearFilters() {
    onChange({
      ...filters,
      area: "",
      category: "",
      hasWebsite: false,
      hasEmail: false,
      hasPhone: false,
    });
  }

  return (
    <section
      aria-label="Result tools"
      className="rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="field">
          <Label htmlFor="results-search">Search</Label>
          <Input
            id="results-search"
            value={filters.query}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder="Company, website, email, phone, area…"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="min-h-11"
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

          <div className="field min-w-[10rem] flex-1">
            <Label htmlFor="results-sort-mobile" className="sr-only">
              Sort
            </Label>
            <Select
              id="results-sort-mobile"
              value={filters.sort}
              onChange={(event) =>
                onChange({
                  ...filters,
                  sort: event.target.value as ResultsSortKey,
                })
              }
            >
              <option value="company_name">Sort: Company name</option>
              <option value="rating">Sort: Rating</option>
              <option value="review_count">Sort: Review count</option>
            </Select>
          </div>

          {hasActiveFilters(filters) ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="hidden gap-4 lg:grid lg:grid-cols-[repeat(3,minmax(0,0.8fr))]">
          <FilterFields
            filters={filters}
            areas={areas}
            categories={categories}
            onChange={onChange}
          />
          <div className="field">
            <Label htmlFor="results-sort">Sort</Label>
            <Select
              id="results-sort"
              value={filters.sort}
              onChange={(event) =>
                onChange({
                  ...filters,
                  sort: event.target.value as ResultsSortKey,
                })
              }
            >
              <option value="company_name">Company name</option>
              <option value="rating">Rating</option>
              <option value="review_count">Review count</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden flex-wrap gap-4 text-sm lg:flex">
        <label className="inline-flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            className="accent-primary"
            checked={filters.hasWebsite}
            onChange={(event) =>
              onChange({ ...filters, hasWebsite: event.target.checked })
            }
          />
          Has website
        </label>
        <label className="inline-flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            className="accent-primary"
            checked={filters.hasEmail}
            onChange={(event) =>
              onChange({ ...filters, hasEmail: event.target.checked })
            }
          />
          Has email
        </label>
        <label className="inline-flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            className="accent-primary"
            checked={filters.hasPhone}
            onChange={(event) =>
              onChange({ ...filters, hasPhone: event.target.checked })
            }
          />
          Has phone
        </label>
        {hasActiveFilters(filters) ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
        <p className="ml-auto font-mono text-xs text-muted">
          Showing {visible} of {total}
        </p>
      </div>

      <p className="mt-3 font-mono text-xs text-muted lg:hidden">
        Showing {visible} of {total}
      </p>

      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter results"
        description="Narrow the list by area, category, or contact coverage."
        className="w-[min(100%-2rem,24rem)]"
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
                Clear all
              </Button>
            ) : null}
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

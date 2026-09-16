import type { ResultsFilters } from "@/components/results/results-toolbar";

export function hasActiveFilters(filters: ResultsFilters): boolean {
  return activeFilterCount(filters) > 0;
}

export function activeFilterCount(filters: ResultsFilters): number {
  let count = 0;
  if (filters.area) count += 1;
  if (filters.category) count += 1;
  if (filters.hasWebsite) count += 1;
  if (filters.hasEmail) count += 1;
  if (filters.hasPhone) count += 1;
  return count;
}

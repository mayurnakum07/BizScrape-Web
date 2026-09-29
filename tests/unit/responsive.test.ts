import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  hasActiveFilters,
} from "@/components/results/filter-utils";
import type { ResultsFilters } from "@/components/results/results-toolbar";
import {
  BREAKPOINTS,
  isDesktopViewport,
  isMobileViewport,
  matchesMinWidth,
  RESULTS_CARDS_CLASSES,
  RESULTS_TABLE_CLASSES,
} from "@/lib/responsive";

const baseFilters: ResultsFilters = {
  query: "",
  area: "",
  category: "",
  hasWebsite: false,
  hasEmail: false,
  hasPhone: false,
  sort: "company_name",
};

describe("responsive breakpoints", () => {
  it("uses Tailwind-aligned min-width values", () => {
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
  });

  it("classifies mobile and desktop viewports", () => {
    expect(isMobileViewport(375)).toBe(true);
    expect(isMobileViewport(767)).toBe(true);
    expect(isMobileViewport(768)).toBe(false);
    expect(isDesktopViewport(1023)).toBe(false);
    expect(isDesktopViewport(1280)).toBe(true);
  });

  it("matches min-width helpers", () => {
    expect(matchesMinWidth(640, "sm")).toBe(true);
    expect(matchesMinWidth(639, "sm")).toBe(false);
  });
});

describe("results presentation classes", () => {
  it("hides the table below md and shows cards", () => {
    expect(RESULTS_TABLE_CLASSES).toContain("md:block");
    expect(RESULTS_TABLE_CLASSES).toContain("hidden");
    expect(RESULTS_CARDS_CLASSES).toContain("md:hidden");
  });
});

describe("results filter helpers", () => {
  it("counts active filters", () => {
    expect(activeFilterCount(baseFilters)).toBe(0);
    expect(
      activeFilterCount({
        ...baseFilters,
        area: "Brooklyn",
        hasEmail: true,
      }),
    ).toBe(2);
  });

  it("detects when filters are active", () => {
    expect(hasActiveFilters(baseFilters)).toBe(false);
    expect(
      hasActiveFilters({
        ...baseFilters,
        category: "Cafe",
      }),
    ).toBe(true);
  });
});

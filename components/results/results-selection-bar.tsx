"use client";

import { ResultsExportActions } from "@/components/results/results-export-actions";
import { Button } from "@/components/ui/button";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";

type ResultsSelectionBarProps = {
  selectedCount: number;
  selectedRecords: BusinessRecord[];
  config: Pick<ScrapeConfig, "city" | "businessType" | "area">;
  onClear: () => void;
  onSelectPage: () => void;
  pageCount: number;
  pageSelected: boolean;
};

/**
 * Bulk actions for selected rows - currently export + clear.
 * Extends existing CSV export without inventing new scrapers.
 */
export function ResultsSelectionBar({
  selectedCount,
  selectedRecords,
  config,
  onClear,
  onSelectPage,
  pageCount,
  pageSelected,
}: ResultsSelectionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 border-b border-primary/30 bg-primary-muted px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs text-foreground">
          <span className="tabular-nums">{selectedCount}</span> selected
        </p>
        {!pageSelected && pageCount > 0 ? (
          <Button type="button" size="sm" variant="ghost" onClick={onSelectPage}>
            Select page
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Clear selection
        </Button>
      </div>
      <ResultsExportActions
        records={selectedRecords}
        config={config}
        size="sm"
        compactHelp
        scopeLabel={`Export selected (${selectedCount})`}
        helpText="Exports only the currently selected rows as CSV."
      />
    </div>
  );
}

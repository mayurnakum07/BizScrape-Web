"use client";

import {
  HISTORY_STATUS_LABEL,
  type HistoryStatusFilter,
} from "@/components/history/history-run-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type HistoryToolbarProps = {
  query: string;
  status: HistoryStatusFilter;
  total: number;
  visible: number;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: HistoryStatusFilter) => void;
};

const STATUS_OPTIONS: HistoryStatusFilter[] = [
  "all",
  "completed",
  "partial",
  "cancelled",
  "running",
  "failed",
];

export function HistoryToolbar({
  query,
  status,
  total,
  visible,
  onQueryChange,
  onStatusChange,
}: HistoryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border-subtle px-3 py-3 sm:flex-row sm:items-center sm:px-4">
      <div className="field min-w-0 flex-1">
        <Label htmlFor="history-search" className="sr-only">
          Search runs
        </Label>
        <Input
          id="history-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search query, location, status…"
          autoComplete="off"
          className="h-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="field min-w-[9.5rem]">
          <Label htmlFor="history-status" className="sr-only">
            Status
          </Label>
          <Select
            id="history-status"
            value={status}
            className="h-9"
            onChange={(event) =>
              onStatusChange(event.target.value as HistoryStatusFilter)
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : HISTORY_STATUS_LABEL[option]}
              </option>
            ))}
          </Select>
        </div>
        <p className="font-mono text-[0.7rem] text-muted">
          <span className="tabular-nums text-foreground">{visible}</span>
          {visible !== total ? (
            <>
              {" "}
              of <span className="tabular-nums">{total}</span>
            </>
          ) : null}{" "}
          runs
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";

import { ResultDetails } from "@/components/results/result-details";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import type { BusinessRecord } from "@/types/business-record";

type ResultDetailsDrawerProps = {
  record: BusinessRecord | null;
  /** Ordered list used for previous/next without closing the drawer. */
  records?: BusinessRecord[];
  onClose: () => void;
  onSelect?: (record: BusinessRecord) => void;
};

/**
 * Business detail drawer — inset right rail on desktop, ~88vh sheet on mobile.
 */
export function ResultDetailsDrawer({
  record,
  records = [],
  onClose,
  onSelect,
}: ResultDetailsDrawerProps) {
  const index = useMemo(() => {
    if (!record) {
      return -1;
    }
    return records.findIndex((item) => item.id === record.id);
  }, [record, records]);

  const hasNav = Boolean(onSelect) && records.length > 1 && index >= 0;
  const previous = hasNav && index > 0 ? records[index - 1] : null;
  const next =
    hasNav && index >= 0 && index < records.length - 1
      ? records[index + 1]
      : null;

  useEffect(() => {
    if (!record || !onSelect || records.length < 2) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && previous) {
        event.preventDefault();
        onSelect?.(previous);
      }
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        onSelect?.(next);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [record, records.length, previous, next, onSelect]);

  const description = record
    ? [record.category, record.area].filter((part) => part.trim()).join(" · ") ||
      "Business contact and coverage details"
    : undefined;

  return (
    <Drawer
      open={Boolean(record)}
      onClose={onClose}
      title={record?.company_name.trim() || "Business details"}
      description={description}
      size="lg"
      footer={
        hasNav ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.7rem] text-muted">
              Record{" "}
              <span className="tabular-nums text-foreground">{index + 1}</span>{" "}
              of{" "}
              <span className="tabular-nums text-foreground">
                {records.length}
              </span>
              <span className="ml-2 hidden text-muted sm:inline">
                ← → to navigate
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10 flex-1 sm:flex-none"
                disabled={!previous}
                onClick={() => previous && onSelect?.(previous)}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10 flex-1 sm:flex-none"
                disabled={!next}
                onClick={() => next && onSelect?.(next)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {record ? (
        <div key={record.id} className="result-details-enter">
          <ResultDetails record={record} />
        </div>
      ) : null}
    </Drawer>
  );
}

/** @deprecated Prefer ResultDetailsDrawer — kept for existing imports/tests. */
export function ResultDetailsDialog(props: ResultDetailsDrawerProps) {
  return <ResultDetailsDrawer {...props} />;
}

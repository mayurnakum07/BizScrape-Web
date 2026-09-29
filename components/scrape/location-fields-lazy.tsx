"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lazy wrapper - `react-country-state-city` is large and only needed on
 * configure screens. Keeps it out of the results/history bundles.
 */
export const LocationFields = dynamic(
  () =>
    import("@/components/scrape/location-fields").then(
      (mod) => mod.LocationFields,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid gap-3 sm:grid-cols-2"
        aria-busy="true"
        aria-label="Loading location fields"
      >
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
  },
);

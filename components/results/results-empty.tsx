import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResultsCollectionStatus } from "@/types/scrape-results";

type ResultsEmptyProps = {
  status: ResultsCollectionStatus;
  filteredEmpty: boolean;
};

export function ResultsEmpty({ status, filteredEmpty }: ResultsEmptyProps) {
  if (filteredEmpty) {
    return (
      <EmptyState
        title="No matching businesses"
        description="Try clearing search or filters to widen the result set."
      />
    );
  }

  if (status === "collecting" || status === "idle") {
    return (
      <EmptyState
        title="No results yet"
        description="Businesses will appear here as BizScrape processes your search."
      />
    );
  }

  return (
    <EmptyState
      title="No businesses matched your search"
      description="The job finished without collecting records. Try a broader area or different business type."
    />
  );
}

export function ResultsLoadingRows() {
  return (
    <div className="hidden space-y-2 md:block" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

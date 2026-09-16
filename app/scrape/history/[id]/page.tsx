"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { HistoryDetailResults } from "@/components/history/history-detail-results";
import { ResultsExportActions } from "@/components/results/results-export-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { useIsClient } from "@/hooks/use-is-client";
import { useStoredScrape } from "@/hooks/use-scrape-history";
import { SCRAPE_PATH } from "@/lib/constants";
import { deleteStoredScrape } from "@/services/scrape-history/idb";
import { formatLocationLabel } from "@/types/scrape";

export default function StoredScrapePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const isClient = useIsClient();
  const { item, loading, error } = useStoredScrape(id);

  if (!isClient || loading) {
    return (
      <Container size="wide" className="py-16">
        <Spinner label="Loading saved scrape…" />
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container className="py-16 sm:py-20">
        <p className="font-mono text-sm tracking-wide text-muted uppercase">
          History
        </p>
        <h1 className="text-page-heading mt-2">Scrape not found</h1>
        <p className="mt-3 max-w-lg text-small">
          {error ??
            "This saved scrape is missing from IndexedDB on this browser."}
        </p>
        <Link
          href={`${SCRAPE_PATH}/history`}
          className={buttonClassName({ className: "mt-6" })}
        >
          Back to history
        </Link>
      </Container>
    );
  }

  const location = formatLocationLabel(item.config);

  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="mb-8 flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm tracking-wide text-primary uppercase">
              Saved scrape
            </p>
            <Badge
              variant={
                item.status === "completed"
                  ? "success"
                  : item.status === "cancelled"
                    ? "warning"
                    : "info"
              }
            >
              {item.status}
            </Badge>
          </div>
          <h1 className="text-page-heading mt-2">{item.config.businessType}</h1>
          <p className="mt-2 text-small">
            {location}
            <span className="mx-2 text-border">·</span>
            {item.summary.businesses} businesses
          </p>
          <p className="mt-3">
            <Link
              href={`${SCRAPE_PATH}/history`}
              className="text-sm text-muted transition-ui hover:text-foreground"
            >
              ← Back to history
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ResultsExportActions
            records={item.records}
            config={item.config}
            size="sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                !window.confirm("Delete this saved scrape from this browser?")
              ) {
                return;
              }
              void deleteStoredScrape(item.id).then(() => {
                router.push(`${SCRAPE_PATH}/history`);
              });
            }}
          >
            Delete from history
          </Button>
        </div>
      </header>

      <HistoryDetailResults item={item} />
    </Container>
  );
}

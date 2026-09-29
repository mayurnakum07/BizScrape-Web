import type { Metadata } from "next";
import Link from "next/link";

import { HistoryList } from "@/components/history/history-list";
import { Container } from "@/components/ui/container";
import { SCRAPE_PATH } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Scrape history",
  description:
    "Manage scrapes saved in this browser — open, export, retry, or delete past runs.",
  robots: { index: false, follow: false },
};

export default function ScrapeHistoryPage() {
  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="font-mono text-[0.65rem] tracking-wide text-primary uppercase">
            Run library
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            Scrape history
          </h1>
          <p className="mt-2 text-sm text-muted">
            Compact run log for this browser. Open a dataset, export CSV, retry
            the same query, or delete a saved scrape.
          </p>
        </div>
        <Link
          href={SCRAPE_PATH}
          className="shrink-0 font-mono text-xs text-muted transition-ui hover:text-foreground"
        >
          ← New scrape
        </Link>
      </header>
      <HistoryList />
    </Container>
  );
}

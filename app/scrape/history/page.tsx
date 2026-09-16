import type { Metadata } from "next";

import { HistoryList } from "@/components/history/history-list";
import { Container } from "@/components/ui/container";
import { SCRAPE_PATH } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scrape history",
  description: "Browse scrapes saved in this browser, download CSV, or delete them.",
  robots: { index: false, follow: false },
};

export default function ScrapeHistoryPage() {
  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="font-mono text-sm tracking-wide text-primary uppercase">
          Library
        </p>
        <h1 className="text-page-heading mt-2">Scrape history</h1>
        <p className="mt-3 text-small">
          Every finished scrape is stored in this browser with IndexedDB. Open
          a past run, download CSV again, or delete it.
        </p>
        <p className="mt-4">
          <Link
            href={SCRAPE_PATH}
            className="text-sm text-muted transition-ui hover:text-foreground"
          >
            ← New scrape
          </Link>
        </p>
      </header>
      <HistoryList />
    </Container>
  );
}

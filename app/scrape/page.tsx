import type { Metadata } from "next";

import { ScrapeForm } from "@/components/scrape/scrape-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Start scraping",
  description:
    "Configure a BizScrape job: business type, country, city, area, target count, and Google Maps discovery.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ScrapePage() {
  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="font-mono text-sm tracking-wide text-primary uppercase">
          Workspace
        </p>
        <h1 className="text-page-heading mt-2">Configure your scrape</h1>
        <p className="mt-3 text-small">
          Choose a business type and location, then start a live Google Maps
          scrape. Finished result sets are saved in this browser under History.
        </p>
      </header>

      <ScrapeForm />
    </Container>
  );
}

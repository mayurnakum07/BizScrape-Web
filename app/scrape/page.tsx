import type { Metadata } from "next";

import { ScrapePageClient } from "@/app/scrape/scrape-page-client";

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
  return <ScrapePageClient />;
}

import Link from "next/link";

import { HeroPipeline } from "@/components/landing/hero-pipeline";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  APP_DESCRIPTION,
  APP_TAGLINE,
  GITHUB_URL,
  SCRAPE_PATH,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

export function LandingHero() {
  return (
    <section className="border-b border-border-subtle">
      <Container
        size="wide"
        className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-20"
      >
        <div className="hero-copy max-w-xl">
          <p className="font-mono text-sm tracking-wide text-primary uppercase">
            BizScrape
          </p>
          <h1 className="text-display mt-4">{APP_TAGLINE}</h1>
          <p className="mt-4 text-base text-muted sm:text-lg">
            {APP_DESCRIPTION.replace(/\.$/, "")} using a Python-powered scraping
            pipeline.
          </p>
          <p className="mt-3 text-sm text-muted">
            Give it a business category and a location. Get a clean, enriched
            CSV you can open in Excel or feed into your own tools.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={SCRAPE_PATH}
              className={cn(buttonClassName({ size: "lg" }), "w-full sm:w-auto")}
            >
              Start scraping
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View BizScrape on GitHub, opens in a new tab"
              className={cn(
                buttonClassName({ variant: "outline", size: "lg" }),
                "w-full gap-2 sm:w-auto",
              )}
            >
              <IconGithub size={16} />
              View on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          <p className="mt-4 text-xs text-muted">
            Opens the scrape workspace to configure your job.
          </p>
        </div>

        <HeroPipeline />
      </Container>
    </section>
  );
}

import Link from "next/link";

import { HeroPipeline } from "@/components/landing/hero-pipeline";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  GITHUB_URL,
  SCRAPE_PATH,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

export function LandingHero() {
  return (
    <section className="border-b border-border">
      <Container
        size="wide"
        className="grid items-start gap-10 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-14"
      >
        <div className="hero-copy max-w-lg pt-1 lg:pt-3">
          <p className="font-mono text-xs tracking-wide text-primary uppercase">
            {APP_NAME} · local business data
          </p>
          <h1 className="text-display mt-3">
            Extract structured business data from local discovery.
          </h1>
          <p className="mt-3 text-base font-medium text-foreground">
            {APP_TAGLINE}
          </p>
          <p className="mt-3 text-base text-muted">
            {APP_DESCRIPTION.replace(/\.$/, "")} through a Python pipeline —
            discovery, website enrichment, then CSV.
          </p>
          <p className="mt-3 text-sm text-muted">
            Configure a niche and location. Watch the job run. Export a clean
            dataset you can open in Excel or pipe into your own tools.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={SCRAPE_PATH}
              className={cn(buttonClassName({ size: "lg" }), "w-full sm:w-auto")}
            >
              Start scrape
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonClassName({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              See the pipeline
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View BizScrape on GitHub, opens in a new tab"
              className={cn(
                buttonClassName({ variant: "ghost", size: "lg" }),
                "w-full gap-2 sm:w-auto",
              )}
            >
              <IconGithub size={16} />
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          <p className="mt-3 font-mono text-xs text-muted">
            niche + location → discover → enrich → CSV
          </p>
        </div>

        <HeroPipeline />
      </Container>
    </section>
  );
}

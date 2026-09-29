import Link from "next/link";

import { Reveal } from "@/components/landing/reveal";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GITHUB_URL, SCRAPE_PATH } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-b border-border-subtle bg-surface"
    >
      <Container size="wide" className="py-10 sm:py-12">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <div className="max-w-xl">
              <p className="font-mono text-xs tracking-wide text-primary uppercase">
                Next step
              </p>
              <h2 id="final-cta-heading" className="text-page-heading mt-2">
                Give BizScrape a business category and a location.
              </h2>
              <p className="mt-3 text-small">
                Configure a job in the scrape workspace and follow live progress
                through to CSV export.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Link
                href={SCRAPE_PATH}
                className={buttonClassName({ size: "lg" })}
              >
                Start scrape
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View BizScrape on GitHub, opens in a new tab"
                className={cn(
                  buttonClassName({ variant: "outline", size: "lg" }),
                  "gap-2",
                )}
              >
                <IconGithub size={16} />
                GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

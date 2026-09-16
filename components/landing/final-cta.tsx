import Link from "next/link";

import { Reveal } from "@/components/landing/reveal";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GITHUB_URL, SCRAPE_PATH } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading">
      <Container size="wide" className="py-16 sm:py-20">
        <Reveal>
          <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center shadow-(--shadow-sm) sm:px-10 sm:py-14">
            <h2 id="final-cta-heading" className="text-page-heading mx-auto max-w-2xl">
              Give BizScrape a business category and a location.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-small">
              Start with a simple query and turn local business discovery into
              structured data. Configure a job in the scrape workspace and
              follow live progress through to CSV export.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={SCRAPE_PATH}
                className={buttonClassName({ size: "lg" })}
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
                  "gap-2",
                )}
              >
                <IconGithub size={16} />
                View GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

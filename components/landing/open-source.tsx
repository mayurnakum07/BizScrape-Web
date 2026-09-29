import { Reveal } from "@/components/landing/reveal";
import { IconGithub } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GITHUB_URL } from "@/lib/constants";
import { cn } from "@/lib/cn";

const points = [
  "Inspect the Python pipeline and selectors",
  "Run the CLI locally with your own queries",
  "Modify enrichment or export behavior",
  "Suggest improvements or new sources",
] as const;

export function OpenSourceSection() {
  return (
    <section
      id="open-source"
      className="scroll-mt-20 border-b border-border"
      aria-labelledby="open-source-heading"
    >
      <Container size="wide" className="py-12 sm:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <Reveal>
            <p className="font-mono text-xs tracking-wide text-primary uppercase">
              Open source
            </p>
            <h2 id="open-source-heading" className="text-page-heading mt-2">
              Built in the open
            </h2>
            <p className="mt-3 max-w-xl text-small">
              BizScrape is MIT-licensed tooling. The scraping engine lives in
              the public Python repository — you can read it, run it, and change
              it. This web app is the interface layer; it does not hide a closed
              scraper.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View BizScrape source on GitHub, opens in a new tab"
              className={cn(
                buttonClassName({ variant: "outline", size: "md" }),
                "mt-6 inline-flex gap-2",
              )}
            >
              <IconGithub size={16} />
              View source on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Reveal>

          <Reveal delayMs={70}>
            <div className="border border-border bg-elevated">
              <p className="border-b border-border-subtle px-4 py-2.5 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
                Community
              </p>
              <ul>
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 border-b border-border-subtle px-4 py-3 text-sm text-muted last:border-b-0"
                  >
                    <span
                      className="mt-1.5 size-1 shrink-0 bg-primary"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border-subtle px-4 py-2.5 font-mono text-xs text-muted">
                Stack: Python · CLI · Playwright · HTTP · CSV
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

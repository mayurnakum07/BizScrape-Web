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
      className="scroll-mt-20 border-b border-border-subtle"
      aria-labelledby="open-source-heading"
    >
      <Container size="wide" className="py-16 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Reveal>
            <p className="font-mono text-sm tracking-wide text-primary uppercase">
              Open source
            </p>
            <h2 id="open-source-heading" className="text-page-heading mt-2">
              Built in the open.
            </h2>
            <p className="mt-3 max-w-xl text-small">
              BizScrape is MIT-licensed tooling. The scraping engine lives in
              the public Python repository — you can read it, run it, and change
              it. This web app is the interface layer; it does not hide a
              closed scraper.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View BizScrape source on GitHub, opens in a new tab"
              className={cn(
                buttonClassName({ size: "lg" }),
                "mt-8 inline-flex gap-2",
              )}
            >
              <IconGithub size={16} />
              View source on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Reveal>

          <Reveal delayMs={80}>
            <ul className="space-y-3 rounded-lg border border-border bg-surface p-5 sm:p-6">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 border-b border-border-subtle pb-3 text-sm text-muted last:border-b-0 last:pb-0"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
              <li className="pt-2 font-mono text-xs text-muted">
                Stack: Python · CLI · Playwright · HTTP · CSV
              </li>
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

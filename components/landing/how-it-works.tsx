import { Reveal } from "@/components/landing/reveal";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

const stages = [
  {
    id: "01",
    title: "Discover",
    body: "Find businesses from configured local sources such as Google Maps, with locality filtering.",
  },
  {
    id: "02",
    title: "Resolve",
    body: "Fill missing website URLs using web search when a listing does not already include one.",
  },
  {
    id: "03",
    title: "Enrich",
    body: "Visit public business websites and extract available contact and social information.",
  },
  {
    id: "04",
    title: "Export",
    body: "Normalize, deduplicate, and write structured results to an Excel-friendly CSV.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border">
      <Container size="wide" className="py-12 sm:py-14">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div>
              <p className="font-mono text-xs tracking-wide text-primary uppercase">
                Pipeline
              </p>
              <h2 className="text-page-heading mt-2">
                Scrape → process → dataset
              </h2>
              <p className="mt-3 max-w-md text-small">
                The web UI drives the same stages as the Python CLI. Scraping
                stays in the engine — this product does not reimplement it in
                the browser.
              </p>
              <p className="mt-4 font-mono text-xs text-muted">
                Business + location → discovery → resolution → enrichment →
                dedupe → CSV
              </p>
            </div>

            <ol className="border border-border bg-surface">
              {stages.map((stage, index) => (
                <li
                  key={stage.id}
                  className={cn(
                    "grid gap-2 px-4 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4 sm:px-5",
                    index < stages.length - 1 && "border-b border-border-subtle",
                  )}
                >
                  <div className="flex items-baseline gap-2 sm:block">
                    <span className="font-mono text-xs text-primary tabular-nums">
                      {stage.id}
                    </span>
                    <h3 className="text-sm font-medium text-foreground sm:mt-1">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="text-small">{stage.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

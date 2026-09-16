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

const flow = [
  "Business + Location",
  "Discovery",
  "Website resolution",
  "Enrichment",
  "Deduplication",
  "CSV",
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border-subtle"
    >
      <Container size="wide" className="py-16 sm:py-20">
        <Reveal>
          <p className="font-mono text-sm tracking-wide text-primary uppercase">
            Pipeline
          </p>
          <h2 className="text-page-heading mt-2 max-w-2xl">
            How BizScrape works
          </h2>
          <p className="mt-3 max-w-2xl text-small">
            The web UI will drive the same stages as the Python CLI: discovery,
            website resolution, enrichment, then CSV export. Scraping stays in
            the Python engine — this product does not reimplement it in the
            browser.
          </p>
        </Reveal>

        <Reveal className="mt-10" delayMs={60}>
          <ol className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface md:flex-row">
            {flow.map((step, index) => (
              <li
                key={step}
                className={cn(
                  "relative flex flex-1 items-center gap-3 px-4 py-3 text-sm",
                  index < flow.length - 1 &&
                    "border-b border-border-subtle md:border-r md:border-b-0",
                )}
              >
                <span className="font-mono text-xs text-primary tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    index === 0 || index === flow.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted",
                  )}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => (
            <Reveal key={stage.id} delayMs={index * 70}>
              <article className="flex h-full flex-col rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
                <p className="font-mono text-xs tracking-wide text-primary">
                  {stage.id}
                </p>
                <h3 className="text-section-heading mt-2">{stage.title}</h3>
                <p className="mt-2 flex-1 text-small">{stage.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/landing/reveal";

const capabilities = [
  "Python pipeline",
  "Google Maps discovery",
  "Website enrichment",
  "Deduplication",
  "CSV export",
  "Open source",
] as const;

export function CapabilityStrip() {
  return (
    <section aria-label="Capabilities" className="border-b border-border-subtle">
      <Container size="wide" className="py-4 sm:py-5">
        <Reveal>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {capabilities.map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                {index > 0 ? (
                  <span className="text-border" aria-hidden="true">
                    /
                  </span>
                ) : null}
                <span className="font-mono text-xs tracking-wide text-muted">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

import { Reveal } from "@/components/landing/reveal";
import { Container } from "@/components/ui/container";

export function TransparencySection() {
  return (
    <section
      id="public-data"
      className="scroll-mt-20 border-b border-border-subtle"
      aria-labelledby="public-data-heading"
    >
      <Container size="wide" className="py-14 sm:py-16">
        <Reveal>
          <div className="max-w-3xl rounded-lg border border-border bg-background-elevated p-6 sm:p-8">
            <p className="font-mono text-sm tracking-wide text-muted uppercase">
              Transparency
            </p>
            <h2 id="public-data-heading" className="text-section-heading mt-2">
              Where the data comes from
            </h2>
            <ul className="mt-4 space-y-3 text-small">
              <li>
                <strong className="font-medium text-foreground">
                  Discovery
                </strong>{" "}
                provides listing data from configured business sources (for
                example Google Maps): name, address, phone, rating, and map
                links when available.
              </li>
              <li>
                <strong className="font-medium text-foreground">
                  Website enrichment
                </strong>{" "}
                visits publicly reachable company sites to collect emails,
                phones, and social links published on those pages.
              </li>
              <li>
                Email addresses come from business websites — not directly from
                Google Maps listings.
              </li>
              <li>
                Results depend on what is currently published and reachable.
                Missing fields are normal when a site does not expose them.
              </li>
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

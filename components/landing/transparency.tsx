import { Reveal } from "@/components/landing/reveal";
import { Container } from "@/components/ui/container";

const points = [
  {
    title: "Discovery",
    body: "Listing data from configured business sources (for example Google Maps): name, address, phone, rating, and map links when available.",
  },
  {
    title: "Website enrichment",
    body: "Visits publicly reachable company sites to collect emails, phones, and social links published on those pages.",
  },
  {
    title: "Email origin",
    body: "Email addresses come from business websites — not directly from Google Maps listings.",
  },
  {
    title: "Coverage",
    body: "Results depend on what is currently published and reachable. Missing fields are normal when a site does not expose them.",
  },
] as const;

export function TransparencySection() {
  return (
    <section
      id="public-data"
      className="scroll-mt-20 border-b border-border-subtle"
      aria-labelledby="public-data-heading"
    >
      <Container size="wide" className="py-10 sm:py-12">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-12">
            <div>
              <p className="font-mono text-xs tracking-wide text-muted uppercase">
                Transparency
              </p>
              <h2 id="public-data-heading" className="text-section-heading mt-2">
                Where the data comes from
              </h2>
            </div>
            <ul className="space-y-4 border-l border-border pl-4 sm:pl-5">
              {points.map((point) => (
                <li key={point.title}>
                  <p className="text-sm font-medium text-foreground">
                    {point.title}
                  </p>
                  <p className="mt-1 text-small">{point.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

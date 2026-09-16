import { Reveal } from "@/components/landing/reveal";
import {
  EXAMPLE_CSV_COLUMNS,
  EXAMPLE_CSV_ROWS,
} from "@/components/landing/example-data";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";

const story = [
  "Messy search results",
  "Discovery",
  "Filtering",
  "Enrichment",
  "Deduplication",
  "Clean structured CSV",
] as const;

export function DataPreview() {
  return (
    <section
      id="data"
      className="scroll-mt-20 border-b border-border-subtle"
      aria-labelledby="data-heading"
    >
      <Container size="wide" className="py-16 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="font-mono text-sm tracking-wide text-primary uppercase">
                Output
              </p>
              <h2 id="data-heading" className="text-page-heading mt-2">
                What you get: structured business data
              </h2>
              <p className="mt-3 text-small">
                BizScrape turns listing noise into a normalized CSV with the
                fields operators actually use — names, websites, phones, emails
                from public sites, socials, ratings, and map links.
              </p>
            </div>
            <Badge variant="info">Example preview</Badge>
          </div>
        </Reveal>

        <Reveal className="mt-8" delayMs={40}>
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {story.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={
                    index === 0
                      ? "text-muted"
                      : index === story.length - 1
                        ? "font-medium text-foreground"
                        : "text-muted"
                  }
                >
                  {step}
                </span>
                {index < story.length - 1 ? (
                  <span className="text-border" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-8" delayMs={80}>
          <p className="mb-2 text-xs text-muted md:hidden">
            Swipe horizontally to explore all columns.
          </p>
          <Table>
            <TableHead>
              <TableRow>
                {EXAMPLE_CSV_COLUMNS.map((column) => (
                  <TableHeaderCell key={column}>
                    <span className="font-mono text-[0.7rem]">{column}</span>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {EXAMPLE_CSV_ROWS.map((row) => (
                <TableRow key={row.company_name}>
                  {EXAMPLE_CSV_COLUMNS.map((column) => (
                    <TableCell
                      key={column}
                      mono={
                        column === "website" ||
                        column === "email_primary" ||
                        column === "phone_primary" ||
                        column === "maps_url" ||
                        column === "linkedin" ||
                        column === "facebook" ||
                        column === "instagram"
                      }
                      truncate={
                        column === "website" ||
                        column === "address" ||
                        column === "maps_url" ||
                        column === "linkedin" ||
                        column === "facebook" ||
                        column === "instagram"
                      }
                    >
                      {row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted">
            Sample rows for illustration only. Domains and contacts are
            fictional. Real scrapes are not run when this page loads.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

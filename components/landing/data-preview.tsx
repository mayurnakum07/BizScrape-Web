import { Reveal } from "@/components/landing/reveal";
import {
  EXAMPLE_CSV_COLUMNS,
  EXAMPLE_CSV_ROWS,
} from "@/components/landing/example-data";
import { Container } from "@/components/ui/container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";

export function DataPreview() {
  return (
    <section
      id="data"
      className="scroll-mt-20 border-b border-border"
      aria-labelledby="data-heading"
    >
      <Container size="wide" className="py-12 sm:py-14">
        <Reveal>
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-wide text-primary uppercase">
              Dataset
            </p>
            <h2 id="data-heading" className="text-page-heading mt-2">
              Structured CSV output
            </h2>
            <p className="mt-3 text-small">
              BizScrape turns listing noise into a normalized table — names,
              websites, phones, emails from public sites, socials, ratings, and
              map links.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-8" delayMs={60}>
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
          <p className="mt-3 font-mono text-xs text-muted">
            Sample rows for illustration only. Domains and contacts are
            fictional. Real scrapes are not run when this page loads.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

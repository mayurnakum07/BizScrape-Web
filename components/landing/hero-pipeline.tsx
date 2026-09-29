import {
  EXAMPLE_CSV_COLUMNS,
  EXAMPLE_CSV_ROWS,
} from "@/components/landing/example-data";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { cn } from "@/lib/cn";

const stages = [
  {
    id: "01",
    label: "Input",
    detail: "cafe · New York · target 50",
    accent: false,
  },
  {
    id: "02",
    label: "Discover",
    detail: "84 found · 61 local",
    accent: false,
  },
  {
    id: "03",
    label: "Enrich",
    detail: "48 sites · 37 emails",
    accent: false,
  },
  {
    id: "04",
    label: "Dataset",
    detail: "61 rows · newyork_cafe.csv",
    accent: true,
  },
] as const;

const previewColumns = [
  "company_name",
  "phone_primary",
  "email_primary",
  "website",
] as const satisfies ReadonlyArray<(typeof EXAMPLE_CSV_COLUMNS)[number]>;

/**
 * Product-shaped hero visual: one workspace showing scrape → process → dataset.
 * Static example data only - not a live scrape.
 */
export function HeroPipeline() {
  return (
    <aside
      className="hero-panel relative w-full min-w-0 border border-border bg-surface"
      aria-label="Example BizScrape pipeline preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-1.5 shrink-0 bg-primary" aria-hidden="true" />
          <p className="truncate font-mono text-[0.65rem] tracking-wide text-muted uppercase">
            Example job · cafe / New York
          </p>
        </div>
        <StatusIndicator status="success" label="Sample complete" />
      </div>

      <ol className="grid grid-cols-2 border-b border-border-subtle lg:grid-cols-4">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className={cn(
              "hero-panel relative px-3 py-3 sm:px-4",
              `hero-panel-${index + 1}`,
              index % 2 === 0 && "border-r border-border-subtle lg:border-r-0",
              index < 2 && "border-b border-border-subtle lg:border-b-0",
              index < stages.length - 1 && "lg:border-r lg:border-border-subtle",
            )}
          >
            <p className="font-mono text-[0.65rem] tracking-wide text-primary">
              {stage.id} {stage.label}
            </p>
            <p
              className={cn(
                "mt-1.5 font-mono text-xs leading-snug",
                stage.accent ? "text-primary" : "text-foreground",
              )}
            >
              {stage.detail}
            </p>
          </li>
        ))}
      </ol>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-elevated">
              {previewColumns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 font-mono text-[0.65rem] font-medium tracking-wide text-muted uppercase sm:px-4"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_CSV_ROWS.map((row) => (
              <tr
                key={row.company_name}
                className="border-b border-border-subtle last:border-b-0"
              >
                {previewColumns.map((column) => (
                  <td
                    key={column}
                    className={cn(
                      "max-w-[10rem] truncate px-3 py-2 sm:px-4",
                      column === "company_name"
                        ? "font-medium text-foreground"
                        : "font-mono text-terminal-fg",
                    )}
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border-subtle bg-terminal">
        <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[0.7rem] leading-relaxed text-terminal-fg hero-terminal sm:px-4">
          <span className="terminal-prompt">$</span> bizscrape run --city newyork
          --niche cafe --target 50
          {"\n"}
          <span className="terminal-stage">DISCOVER</span>
          {"  "}61 local matches
          {"\n"}
          <span className="terminal-stage">ENRICH</span>
          {"    "}37 public emails
          {"\n"}
          <span className="terminal-ok">EXPORT</span>
          {"    "}wrote data/newyork_cafe.csv
        </pre>
      </div>
    </aside>
  );
}

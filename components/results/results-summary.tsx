import type { ResultSummary } from "@/types/scrape-results";

type ResultsSummaryProps = {
  summary: ResultSummary;
};

const metrics: Array<{ key: keyof ResultSummary; label: string }> = [
  { key: "businesses", label: "Businesses" },
  { key: "websites", label: "Websites" },
  { key: "emails", label: "Emails" },
  { key: "phones", label: "Phones" },
  { key: "duplicates", label: "Duplicates" },
];

/**
 * Compact metric strip — keeps the dataset table as the visual focus.
 */
export function ResultsSummary({ summary }: ResultsSummaryProps) {
  return (
    <section aria-label="Result summary" className="results-metric-strip">
      <dl className="grid grid-cols-2 divide-y divide-border-subtle border border-border bg-surface sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.key} className="px-3 py-2.5 sm:px-4">
            <dt className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
              {metric.label}
            </dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-foreground">
              {summary[metric.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

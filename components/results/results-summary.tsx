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

export function ResultsSummary({ summary }: ResultsSummaryProps) {
  return (
    <section aria-label="Result summary">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-border bg-surface px-3 py-3"
          >
            <dt className="text-xs text-muted">{metric.label}</dt>
            <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">
              {summary[metric.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

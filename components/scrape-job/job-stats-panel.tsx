import type { JobStats } from "@/types/scrape-job";

type JobStatsPanelProps = {
  stats: JobStats;
  processed: number;
};

const rows: Array<{
  key: keyof JobStats | "processed";
  label: string;
  hint: string;
}> = [
  { key: "businessesFound", label: "Discovered", hint: "Listings found" },
  { key: "localMatches", label: "Local matches", hint: "In scope" },
  { key: "websitesResolved", label: "Websites", hint: "Resolved" },
  { key: "phonesFound", label: "Phones", hint: "Extracted" },
  { key: "emailsFound", label: "Emails", hint: "Extracted" },
  { key: "duplicatesRemoved", label: "Duplicates", hint: "Removed" },
  { key: "processed", label: "Processed", hint: "Collected" },
];

export function JobStatsPanel({ stats, processed }: JobStatsPanelProps) {
  return (
    <section aria-label="Live metrics" className="border border-border bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h2 className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Live metrics
        </h2>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((row) => {
          const value = row.key === "processed" ? processed : stats[row.key];
          return (
            <div key={row.key} className="bg-surface px-4 py-3">
              <dt className="text-xs text-muted">{row.label}</dt>
              <dd className="job-metric-value mt-1 font-mono text-xl text-foreground">
                {value}
              </dd>
              <p className="mt-0.5 font-mono text-[0.65rem] text-muted">
                {row.hint}
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

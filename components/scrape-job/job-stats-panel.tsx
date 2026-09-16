import type { JobStats } from "@/types/scrape-job";

type JobStatsPanelProps = {
  stats: JobStats;
};

const rows: Array<{ key: keyof JobStats; label: string }> = [
  { key: "businessesFound", label: "Businesses found" },
  { key: "localMatches", label: "Local matches" },
  { key: "websitesResolved", label: "Websites resolved" },
  { key: "emailsFound", label: "Emails found" },
  { key: "phonesFound", label: "Phones found" },
  { key: "duplicatesRemoved", label: "Duplicates removed" },
];

export function JobStatsPanel({ stats }: JobStatsPanelProps) {
  return (
    <section
      aria-label="Statistics"
      className="rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="text-sm font-medium text-foreground">Statistics</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-md border border-border-subtle bg-background-elevated px-3 py-2"
          >
            <dt className="text-xs text-muted">{row.label}</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-foreground">
              {stats[row.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

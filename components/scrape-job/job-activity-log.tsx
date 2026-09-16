import type { JobActivityEntry } from "@/types/scrape-job";

type JobActivityLogProps = {
  entries: JobActivityEntry[];
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 19);
  }
}

/**
 * Technical activity panel. Not a polite live region — updates are visual.
 * A separate polite status string covers the current operation for AT.
 */
export function JobActivityLog({ entries }: JobActivityLogProps) {
  const rows = [...entries].reverse();

  return (
    <section
      aria-label="Activity"
      className="flex min-h-0 flex-col rounded-lg border border-border bg-[#080a0d]"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <h2 className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Activity
        </h2>
        <span className="font-mono text-[0.65rem] text-muted">
          {entries.length} events
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto px-3 py-3 sm:max-h-80">
        {rows.length === 0 ? (
          <p className="font-mono text-xs text-muted">No events yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 font-mono text-xs leading-relaxed text-[#c8cdd3]"
              >
                <time
                  dateTime={entry.timestamp}
                  className="tabular-nums text-muted"
                >
                  {formatTime(entry.timestamp)}
                </time>
                <span className="break-anywhere">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

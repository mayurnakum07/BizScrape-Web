import { PIPELINE_STAGES, type JobActivityEntry } from "@/types/scrape-job";
import { cn } from "@/lib/cn";

type JobActivityLogProps = {
  entries: JobActivityEntry[];
};

const MAX_VISIBLE = 40;

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

function stageShort(stageId: JobActivityEntry["stage"]): string | null {
  if (!stageId) {
    return null;
  }
  return (
    PIPELINE_STAGES.find((stage) => stage.id === stageId)?.shortLabel ?? stageId
  );
}

/**
 * Technical activity panel. Newest first, capped to limit render cost.
 * Not a polite live region — JobView owns AT announcements.
 */
export function JobActivityLog({ entries }: JobActivityLogProps) {
  const rows = entries.slice(-MAX_VISIBLE).reverse();
  const hidden = Math.max(0, entries.length - rows.length);

  return (
    <section
      aria-label="Activity"
      className="flex min-h-0 flex-col border border-border bg-terminal"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
        <h2 className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Activity
        </h2>
        <span className="font-mono text-[0.65rem] text-muted">
          {entries.length} event{entries.length === 1 ? "" : "s"}
          {hidden > 0 ? ` · showing ${rows.length}` : ""}
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto px-3 py-3">
        {rows.length === 0 ? (
          <p className="font-mono text-xs text-muted">No events yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((entry) => {
              const stage = stageShort(entry.stage);
              return (
                <li
                  key={entry.id}
                  className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 font-mono text-xs leading-relaxed text-terminal-fg"
                >
                  <time
                    dateTime={entry.timestamp}
                    className="tabular-nums text-muted"
                  >
                    {formatTime(entry.timestamp)}
                  </time>
                  <span className="min-w-0 break-anywhere">
                    {stage ? (
                      <span
                        className={cn(
                          "mr-2 inline-block tracking-wide text-primary uppercase",
                        )}
                      >
                        {stage}
                      </span>
                    ) : null}
                    {entry.message}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

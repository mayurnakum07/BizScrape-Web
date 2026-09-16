import { SCRAPE_SOURCES } from "@/lib/scrape/constants";
import type { ScrapeSourceId } from "@/types/scrape";

type SourceSelectorProps = {
  value: ScrapeSourceId[];
  error?: string;
  onChange: (sources: ScrapeSourceId[]) => void;
};

/**
 * Discovery is Google Maps only. The control is informational (always on).
 */
export function SourceSelector({ value, error }: SourceSelectorProps) {
  const hintId = "sources-hint";
  const errorId = error ? "sources-error" : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const source = SCRAPE_SOURCES[0];
  if (!source) {
    return null;
  }
  const checked = value.includes(source.id);
  const inputId = `source-${source.id}`;

  return (
    <fieldset
      className="field"
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-label">Sources</legend>
      <p id={hintId} className="field-hint mt-1">
        Discovery uses Google Maps. Enrichment still uses public business
        websites after listings are found.
      </p>

      <div className="mt-3 grid gap-2">
        <label
          htmlFor={inputId}
          className="flex cursor-default gap-3 rounded-md border border-primary/40 bg-primary-muted px-3 py-3"
        >
          <input
            id={inputId}
            type="checkbox"
            name="sources"
            value={source.id}
            checked={checked}
            disabled
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {source.label}
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              {source.description}
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p id={errorId} className="field-error mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

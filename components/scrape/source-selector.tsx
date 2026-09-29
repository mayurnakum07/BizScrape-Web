import { Badge } from "@/components/ui/badge";
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
      <legend className="text-label">Discovery source</legend>
      <p id={hintId} className="field-hint mt-1">
        Listings come from Google Maps. Contact enrichment still uses public
        business websites after discovery.
      </p>

      <div className="mt-3">
        <label
          htmlFor={inputId}
          className="flex cursor-default items-start gap-3 border border-border bg-elevated px-3 py-2.5"
        >
          <input
            id={inputId}
            type="checkbox"
            name="sources"
            value={source.id}
            checked={checked}
            readOnly
            aria-disabled="true"
            className="mt-0.5 size-4 shrink-0 accent-primary"
            onClick={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
              }
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {source.label}
              </span>
              <Badge variant="primary">Required</Badge>
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

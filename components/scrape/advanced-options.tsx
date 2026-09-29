import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";

type AdvancedOptionsProps = {
  searchAllLocalities: boolean;
  onSearchAllLocalitiesChange: (value: boolean) => void;
};

/**
 * Optional filters collapsed by default. Essential query fields stay outside.
 */
export function AdvancedOptions({
  searchAllLocalities,
  onSearchAllLocalitiesChange,
}: AdvancedOptionsProps) {
  return (
    <details className="group border border-border-subtle bg-elevated open:bg-elevated">
      <summary
        className={cn(
          "cursor-pointer list-none px-3 py-2.5 marker:content-none",
          "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Advanced filters
            </span>
            <span className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
              Optional
            </span>
            {searchAllLocalities ? (
              <span className="font-mono text-[0.65rem] text-primary">
                · all localities on
              </span>
            ) : null}
          </span>
          <span
            className="font-mono text-xs text-muted transition-ui group-open:rotate-90"
            aria-hidden="true"
          >
            ▸
          </span>
        </span>
      </summary>
      <div className="border-t border-border-subtle px-3 py-3">
        <Checkbox
          id="search-all-localities"
          name="searchAllLocalities"
          checked={searchAllLocalities}
          onChange={(event) =>
            onSearchAllLocalitiesChange(event.target.checked)
          }
          label="Search all known localities"
          description="Expand discovery across known neighbourhoods for the selected city when the engine supports locality lists."
        />
      </div>
    </details>
  );
}

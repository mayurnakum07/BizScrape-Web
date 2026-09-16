import { Checkbox } from "@/components/ui/checkbox";

type AdvancedOptionsProps = {
  searchAllLocalities: boolean;
  onSearchAllLocalitiesChange: (value: boolean) => void;
};

/**
 * Advanced options that map to existing CLI concepts only.
 * Collapsed by default so the main form stays approachable.
 */
export function AdvancedOptions({
  searchAllLocalities,
  onSearchAllLocalitiesChange,
}: AdvancedOptionsProps) {
  return (
    <details className="rounded-lg border border-border-subtle bg-background-elevated">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          Advanced options
          <span className="font-mono text-xs font-normal text-muted">
            optional
          </span>
        </span>
      </summary>
      <div className="border-t border-border-subtle px-4 py-4">
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

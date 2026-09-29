import { Badge } from "@/components/ui/badge";
import { SCRAPE_SOURCES } from "@/lib/scrape/constants";
import { describeSearchScope } from "@/lib/scrape/validation";
import { cn } from "@/lib/cn";
import type { ScrapeSourceId } from "@/types/scrape";

type ScrapeSummaryProps = {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
  className?: string;
};

function SummaryRow({
  label,
  value,
  empty,
  mono,
}: {
  label: string;
  value: string;
  empty?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-sm break-anywhere",
          mono && "font-mono text-xs",
          empty ? "text-muted italic" : "font-medium text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function buildQueryLine(input: {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number;
  sources: ScrapeSourceId[];
}): string {
  const type = input.businessType.trim() || "…";
  const place = [input.city, input.state, input.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const area = input.area.trim();
  const target = Number.isFinite(input.target) ? String(input.target) : "…";
  const source =
    input.sources
      .map((id) => SCRAPE_SOURCES.find((row) => row.id === id)?.label ?? id)
      .join(", ") || "…";

  const location = place
    ? area
      ? `${area}, ${place}`
      : place
    : "location unset";

  return `${type} · ${location} · ${target} · ${source}`;
}

/**
 * Live query summary for the scrape workspace.
 */
export function ScrapeSummary({
  businessType,
  country,
  state,
  city,
  area,
  target,
  sources,
  searchAllLocalities,
  className,
}: ScrapeSummaryProps) {
  const typeLabel = businessType.trim();
  const countryLabel = country.trim();
  const stateLabel = state.trim();
  const cityLabel = city.trim();
  const areaLabel = area.trim();
  const sourceLabels = sources
    .map((id) => SCRAPE_SOURCES.find((source) => source.id === id)?.label ?? id)
    .join(", ");

  const place = [cityLabel, stateLabel, countryLabel].filter(Boolean).join(", ");
  const scope = describeSearchScope({
    businessType: typeLabel,
    country: countryLabel,
    state: stateLabel,
    city: cityLabel,
    area: areaLabel,
    target: Number.isFinite(target) ? target : null,
  });
  const queryLine = buildQueryLine({
    businessType,
    country,
    state,
    city,
    area,
    target,
    sources,
  });
  const ready =
    Boolean(typeLabel) &&
    Boolean(countryLabel) &&
    Boolean(stateLabel) &&
    Boolean(cityLabel) &&
    Number.isFinite(target) &&
    sources.length > 0;

  return (
    <aside
      className={cn(
        "h-fit border border-border bg-elevated lg:sticky lg:top-[calc(var(--header-height)+0.75rem)]",
        className,
      )}
      aria-label="Live query summary"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Live query
        </p>
        <Badge variant={ready ? "primary" : "default"}>
          {ready ? "Ready" : "Incomplete"}
        </Badge>
      </div>

      <div className="border-b border-border-subtle bg-terminal px-4 py-3">
        <p className="font-mono text-xs leading-relaxed break-anywhere text-terminal-fg">
          {queryLine}
        </p>
      </div>

      <dl className="divide-y divide-border-subtle px-4">
        <SummaryRow
          label="Category"
          value={typeLabel || "Not set"}
          empty={!typeLabel}
        />
        <SummaryRow
          label="Country"
          value={countryLabel || "Not set"}
          empty={!countryLabel}
        />
        <SummaryRow
          label="State"
          value={stateLabel || "Not set"}
          empty={!stateLabel}
        />
        <SummaryRow
          label="City"
          value={cityLabel || "Not set"}
          empty={!cityLabel}
        />
        <SummaryRow
          label="Area"
          value={areaLabel || "City-wide"}
          empty={!areaLabel}
        />
        <SummaryRow
          label="Target"
          value={Number.isFinite(target) ? String(target) : "Not set"}
          empty={!Number.isFinite(target)}
          mono
        />
        <SummaryRow
          label="Source"
          value={sourceLabels || "None"}
          empty={sources.length === 0}
        />
        {searchAllLocalities ? (
          <SummaryRow label="Filters" value="All localities" />
        ) : null}
      </dl>

      <div className="border-t border-border-subtle px-4 py-3">
        <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Scope
        </p>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
          {scope}
        </p>
        {place ? (
          <p className="mt-2 font-mono text-[0.7rem] text-muted">
            maps · {place}
            {areaLabel ? ` · area ${areaLabel}` : ""}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

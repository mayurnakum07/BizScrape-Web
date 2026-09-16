import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { SCRAPE_SOURCES } from "@/lib/scrape/constants";
import { describeSearchScope } from "@/lib/scrape/validation";
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
};

function SummaryRow({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd
        className={
          empty
            ? "max-w-[60%] text-right text-sm text-muted italic"
            : "max-w-[60%] text-right text-sm font-medium text-foreground break-anywhere"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function ScrapeSummary({
  businessType,
  country,
  state,
  city,
  area,
  target,
  sources,
  searchAllLocalities,
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

  return (
    <Card className="h-fit border-border/80 lg:sticky lg:top-20" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Your search</CardTitle>
          <Badge variant="default">Live preview</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border-subtle">
          <SummaryRow
            label="Business"
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
            value={
              Number.isFinite(target) ? `${target} businesses` : "Not set"
            }
            empty={!Number.isFinite(target)}
          />
          <SummaryRow
            label="Source"
            value={sourceLabels || "None"}
            empty={sources.length === 0}
          />
          {searchAllLocalities ? (
            <SummaryRow label="Localities" value="Search all known" />
          ) : null}
        </dl>

        <Divider className="my-4" />
        <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          Scope
        </p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">
          {scope}
        </pre>
        {place ? (
          <p className="mt-3 text-xs text-muted">
            Maps query uses <span className="text-foreground">{place}</span>
            {areaLabel ? <> · area filter <span className="text-foreground">{areaLabel}</span></> : null}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

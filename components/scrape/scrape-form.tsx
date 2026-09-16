"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AdvancedOptions } from "@/components/scrape/advanced-options";
import { BusinessTypeField } from "@/components/scrape/business-type-field";
import { LocationFields } from "@/components/scrape/location-fields";
import { ScrapeSummary } from "@/components/scrape/scrape-summary";
import { SourceSelector } from "@/components/scrape/source-selector";
import { TargetField } from "@/components/scrape/target-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SCRAPE_CONFIG } from "@/lib/scrape/constants";
import {
  validateScrapeConfig,
  type ScrapeFieldErrors,
} from "@/lib/scrape/validation";
import type { ScrapeSourceId } from "@/types/scrape";
import { SCRAPE_PATH } from "@/lib/constants";
import { createScrapeJob } from "@/services/scrape-job";

type FormState = {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
};

export function ScrapeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    businessType: DEFAULT_SCRAPE_CONFIG.businessType,
    country: DEFAULT_SCRAPE_CONFIG.country,
    state: DEFAULT_SCRAPE_CONFIG.state,
    city: DEFAULT_SCRAPE_CONFIG.city,
    area: DEFAULT_SCRAPE_CONFIG.area ?? "",
    target: DEFAULT_SCRAPE_CONFIG.target,
    sources: DEFAULT_SCRAPE_CONFIG.sources,
    searchAllLocalities: DEFAULT_SCRAPE_CONFIG.searchAllLocalities,
  });
  const [errors, setErrors] = useState<ScrapeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key as keyof ScrapeFieldErrors];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const result = validateScrapeConfig(form);
    if (!result.ok) {
      setErrors(result.errors);
      const firstKey = Object.keys(result.errors)[0];
      if (firstKey) {
        const el = document.getElementById(
          firstKey === "sources"
            ? "source-gmaps"
            : firstKey === "businessType"
              ? "business-type"
              : firstKey,
        );
        el?.focus();
      }
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const job = await createScrapeJob(result.config);
      router.push(`${SCRAPE_PATH}/job/${job.id}`);
    } catch (error) {
      setSubmitting(false);
      const message =
        error instanceof Error
          ? error.message
          : "Could not start the job. Please try again.";
      setErrors({
        businessType: message,
      });
    }
  }

  return (
    <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] lg:gap-8">
      <Card padding="lg" className="border-border/80">
        <CardHeader className="space-y-2">
          <CardTitle>Scrape configuration</CardTitle>
          <p className="text-small">
            Pick what to find and where. Discovery runs on Google Maps through
            the local Python API.
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
            <section aria-labelledby="section-search" className="space-y-4">
              <div className="border-b border-border-subtle pb-2">
                <h3
                  id="section-search"
                  className="font-mono text-xs tracking-wide text-muted uppercase"
                >
                  What to find
                </h3>
              </div>
              <BusinessTypeField
                value={form.businessType}
                error={errors.businessType}
                onChange={(value) => update("businessType", value)}
              />
            </section>

            <section aria-labelledby="section-location" className="space-y-4">
              <div className="border-b border-border-subtle pb-2">
                <h3
                  id="section-location"
                  className="font-mono text-xs tracking-wide text-muted uppercase"
                >
                  Where to search
                </h3>
              </div>
              <LocationFields
                country={form.country}
                state={form.state}
                city={form.city}
                area={form.area}
                countryError={errors.country}
                stateError={errors.state}
                cityError={errors.city}
                onCountryChange={(value) => update("country", value)}
                onStateChange={(value) => update("state", value)}
                onCityChange={(value) => update("city", value)}
                onAreaChange={(value) => update("area", value)}
              />
            </section>

            <section aria-labelledby="section-collection" className="space-y-4">
              <div className="border-b border-border-subtle pb-2">
                <h3
                  id="section-collection"
                  className="font-mono text-xs tracking-wide text-muted uppercase"
                >
                  How many
                </h3>
              </div>
              <TargetField
                value={form.target}
                error={errors.target}
                onChange={(value) => update("target", value)}
              />
              <SourceSelector
                value={form.sources}
                error={errors.sources}
                onChange={(value) => update("sources", value)}
              />
            </section>

            <AdvancedOptions
              searchAllLocalities={form.searchAllLocalities}
              onSearchAllLocalitiesChange={(value) =>
                update("searchAllLocalities", value)
              }
            />

            <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
              <p className="text-xs text-muted">
                Results are saved in this browser after each scrape.
              </p>
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="w-full sm:ml-auto sm:w-auto"
              >
                {submitting ? "Starting…" : "Start scraping"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ScrapeSummary
        businessType={form.businessType}
        country={form.country}
        state={form.state}
        city={form.city}
        area={form.area}
        target={form.target}
        sources={form.sources}
        searchAllLocalities={form.searchAllLocalities}
      />
    </div>
  );
}

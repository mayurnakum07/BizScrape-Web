"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AdvancedOptions } from "@/components/scrape/advanced-options";
import { BusinessTypeField } from "@/components/scrape/business-type-field";
import { FormSection } from "@/components/scrape/form-section";
import { LocationFields } from "@/components/scrape/location-fields-lazy";
import { ScrapeSummary } from "@/components/scrape/scrape-summary";
import { SourceSelector } from "@/components/scrape/source-selector";
import { TargetField } from "@/components/scrape/target-field";
import { Button } from "@/components/ui/button";
import { DEFAULT_SCRAPE_CONFIG } from "@/lib/scrape/constants";
import {
  validateScrapeConfig,
  type ScrapeFieldErrors,
} from "@/lib/scrape/validation";
import { validationSummaryCopy } from "@/lib/workflow-state";
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

  const errorCount = Object.keys(errors).length;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(16.5rem,0.75fr)] lg:gap-6">
      <div className="min-w-0 border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3 sm:px-5">
          <div>
            <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
              Query builder
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Category, location, target, and source for this job.
            </p>
          </div>
          {errorCount > 0 ? (
            <p className="max-w-xs text-right font-mono text-xs text-error" role="status">
              {validationSummaryCopy(errorCount).title}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FormSection
            id="section-category"
            title="Category"
            description="What kind of businesses should the scrape collect?"
            className="border-b border-border-subtle"
          >
            <BusinessTypeField
              value={form.businessType}
              error={errors.businessType}
              onChange={(value) => update("businessType", value)}
            />
          </FormSection>

          <FormSection
            id="section-location"
            title="Location"
            description="Country, state, and city are required. Area narrows discovery inside the city."
            className="border-b border-border-subtle"
          >
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
          </FormSection>

          <FormSection
            id="section-collection"
            title="Target & source"
            description="How many businesses to aim for, and which discovery source to use."
            className="border-b border-border-subtle"
          >
            <div className="grid gap-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-start">
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
            </div>
          </FormSection>

          <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
            <AdvancedOptions
              searchAllLocalities={form.searchAllLocalities}
              onSearchAllLocalitiesChange={(value) =>
                update("searchAllLocalities", value)
              }
            />
          </div>

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-muted">
              Finished result sets are saved in this browser under History.
            </p>
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full shrink-0 sm:w-auto"
            >
              {submitting ? "Starting…" : "Start scrape"}
            </Button>
          </div>
        </form>
      </div>

      <ScrapeSummary
        businessType={form.businessType}
        country={form.country}
        state={form.state}
        city={form.city}
        area={form.area}
        target={form.target}
        sources={form.sources}
        searchAllLocalities={form.searchAllLocalities}
        className="order-first lg:order-none"
      />
    </div>
  );
}

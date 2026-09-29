"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { AdvancedOptions } from "@/components/scrape/advanced-options";
import { BusinessTypeField } from "@/components/scrape/business-type-field";
import { LocationFields } from "@/components/scrape/location-fields-lazy";
import { SCRAPE_FLOW_DEFAULTS } from "@/components/scrape/scrape-flow-defaults";
import { TargetField } from "@/components/scrape/target-field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SCRAPE_PATH } from "@/lib/constants";
import {
  validateScrapeConfig,
  type ScrapeFieldErrors,
} from "@/lib/scrape/validation";
import { validationSummaryCopy } from "@/lib/workflow-state";
import { createScrapeJob } from "@/services/scrape-job";
import type { ScrapeSourceId } from "@/types/scrape";

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

function ConfigureBody({
  form,
  errors,
  errorCount,
  onUpdate,
  onSubmit,
  formId,
}: {
  form: FormState;
  errors: ScrapeFieldErrors;
  errorCount: number;
  onUpdate: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formId: string;
}) {
  return (
    <form
      id={formId}
      className="scrape-flow-phase flex flex-col gap-5"
      onSubmit={onSubmit}
      noValidate
    >
      {errorCount > 0 ? (
        <p
          className="border border-error/40 bg-error-muted px-3 py-2 font-mono text-xs text-error"
          role="alert"
        >
          {validationSummaryCopy(errorCount).title}.{" "}
          {validationSummaryCopy(errorCount).nextStep}
        </p>
      ) : null}

      <BusinessTypeField
        value={form.businessType}
        error={errors.businessType}
        onChange={(value) => onUpdate("businessType", value)}
      />

      <div className="border-t border-border-subtle pt-5">
        <p className="mb-3 text-label text-muted">Location</p>
        <LocationFields
          country={form.country}
          state={form.state}
          city={form.city}
          area={form.area}
          countryError={errors.country}
          stateError={errors.state}
          cityError={errors.city}
          onCountryChange={(value) => onUpdate("country", value)}
          onStateChange={(value) => onUpdate("state", value)}
          onCityChange={(value) => onUpdate("city", value)}
          onAreaChange={(value) => onUpdate("area", value)}
        />
      </div>

      <div className="border-t border-border-subtle pt-5">
        <TargetField
          value={form.target}
          error={errors.target}
          onChange={(value) => onUpdate("target", value)}
        />
      </div>

      <div className="border-t border-border-subtle pt-5">
        <AdvancedOptions
          searchAllLocalities={form.searchAllLocalities}
          onSearchAllLocalitiesChange={(value) =>
            onUpdate("searchAllLocalities", value)
          }
        />
      </div>
    </form>
  );
}

type ScrapeFlowModalProps = {
  open: boolean;
  onClose: () => void;
  initialJobId?: string | null;
};

/**
 * Configure-only scrape modal. Submit navigates to the live job page.
 */
export function ScrapeFlowModal({
  open,
  onClose,
  initialJobId = null,
}: ScrapeFlowModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    businessType: SCRAPE_FLOW_DEFAULTS.businessType,
    country: SCRAPE_FLOW_DEFAULTS.country,
    state: SCRAPE_FLOW_DEFAULTS.state,
    city: SCRAPE_FLOW_DEFAULTS.city,
    area: SCRAPE_FLOW_DEFAULTS.area ?? "",
    target: SCRAPE_FLOW_DEFAULTS.target,
    sources: SCRAPE_FLOW_DEFAULTS.sources,
    searchAllLocalities: SCRAPE_FLOW_DEFAULTS.searchAllLocalities,
  });
  const [errors, setErrors] = useState<ScrapeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialJobId) {
      return;
    }
    router.replace(`${SCRAPE_PATH}/job/${initialJobId}`);
  }, [initialJobId, router]);

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
      onClose();
      router.push(`${SCRAPE_PATH}/job/${job.id}`);
    } catch (error) {
      setSubmitting(false);
      setErrors({
        businessType:
          error instanceof Error
            ? error.message
            : "Could not start the job. Please try again.",
      });
    }
  }

  const formId = "scrape-flow-form";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Start scrape"
      description="Set category and location, then start. Advanced filters stay optional."
      size="xl"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Results save in this browser under History.
          </p>
          <Button
            type="submit"
            form={formId}
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Starting…" : "Start scrape"}
          </Button>
        </div>
      }
    >
      <ConfigureBody
        formId={formId}
        form={form}
        errors={errors}
        errorCount={Object.keys(errors).length}
        onUpdate={update}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      />
    </Dialog>
  );
}

function ScrapeFlowModalFromSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job");

  return (
    <ScrapeFlowModal
      open={open}
      onClose={onClose}
      initialJobId={initialJobId}
    />
  );
}

/** Page entry with Suspense for useSearchParams. */
export function ScrapeFlowModalGate({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[calc(100dvh-var(--header-height))] w-full flex-col items-center justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <Spinner
            label="Loading scrape…"
            size="lg"
            className="flex-col text-foreground"
          />
        </div>
      }
    >
      <ScrapeFlowModalFromSearch open={open} onClose={onClose} />
    </Suspense>
  );
}

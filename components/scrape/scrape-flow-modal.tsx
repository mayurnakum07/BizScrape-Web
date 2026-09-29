"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";


import { BusinessTypeField } from "@/components/scrape/business-type-field";
import { LocationFields } from "@/components/scrape/location-fields-lazy";
import { SCRAPE_FLOW_DEFAULTS } from "@/components/scrape/scrape-flow-defaults";
import { TargetField } from "@/components/scrape/target-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

    </form>
  );
}

type ScrapeFlowModalProps = {
  open: boolean;
  onClose: () => void;
  initialJobId?: string | null;
};

// ...

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
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        className="sm:max-w-2xl p-0 border border-primary/30 shadow-[0_0_40px_rgba(200,240,74,0.1)] bg-black/95 overflow-hidden gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(200,240,74,0.03)_50%,transparent_100%)] h-full w-full bg-[length:100%_4px] bg-repeat-y animate-[motion-live-dot_2s_linear_infinite]" />

        <DialogHeader className="bg-[#111513]/90 backdrop-blur-md px-6 py-4 border-b border-primary/20 relative z-10 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-primary font-mono drop-shadow-[0_0_8px_rgba(200,240,74,0.3)]">
              Start scrape_job
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Set category and location, then start. Advanced filters stay
              optional.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-6 px-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20 relative z-10">
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
        </div>

        <DialogFooter className="px-6 py-4 border-t border-primary/20 bg-[#080A09]/90 relative z-10 sm:justify-between items-center gap-2">
          <p className="text-xs font-mono text-primary/50 w-full sm:w-auto text-left"></p>
          <Button
            type="submit"
            form={formId}
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground shadow-[0_0_15px_rgba(200,240,74,0.4)]"
          >
            {submitting ? "INITIALIZING…" : "SCRAPE"}
          </Button>
        </DialogFooter>
      </DialogContent>
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

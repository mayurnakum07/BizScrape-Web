import {
  TARGET_MAX,
  TARGET_MIN,
} from "@/lib/scrape/constants";
import type { ScrapeConfig, ScrapeSourceId } from "@/types/scrape";

export type ScrapeFieldErrors = Partial<
  Record<
    "businessType" | "country" | "state" | "city" | "area" | "target" | "sources",
    string
  >
>;

export type ScrapeValidationResult =
  | { ok: true; config: ScrapeConfig }
  | { ok: false; errors: ScrapeFieldErrors };

function trim(value: string): string {
  return value.trim();
}

export function normalizeScrapeDraft(input: {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number | string;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
}): {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number | null;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
} {
  const targetRaw =
    typeof input.target === "number"
      ? input.target
      : Number.parseInt(String(input.target).trim(), 10);

  return {
    businessType: trim(input.businessType),
    country: trim(input.country),
    state: trim(input.state),
    city: trim(input.city),
    area: trim(input.area),
    target: Number.isFinite(targetRaw) ? targetRaw : null,
    sources: [...new Set(input.sources)],
    searchAllLocalities: input.searchAllLocalities,
  };
}

export function validateScrapeConfig(input: {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number | string;
  sources: ScrapeSourceId[];
  searchAllLocalities: boolean;
}): ScrapeValidationResult {
  const normalized = normalizeScrapeDraft(input);
  const errors: ScrapeFieldErrors = {};

  if (!normalized.businessType) {
    errors.businessType = "Enter a business type.";
  }

  if (!normalized.country) {
    errors.country = "Select a country.";
  }

  if (!normalized.state) {
    errors.state = "Select a state or region.";
  }

  if (!normalized.city) {
    errors.city = "Select a city.";
  }

  if (normalized.target === null) {
    errors.target = "Enter a whole number for target businesses.";
  } else if (normalized.target < TARGET_MIN) {
    errors.target = `Target must be at least ${TARGET_MIN}.`;
  } else if (normalized.target > TARGET_MAX) {
    errors.target = `Target cannot exceed ${TARGET_MAX}.`;
  } else if (!Number.isInteger(normalized.target)) {
    errors.target = "Target must be a whole number.";
  }

  if (normalized.sources.length === 0) {
    errors.sources = "Select at least one source.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const config: ScrapeConfig = {
    businessType: normalized.businessType,
    country: normalized.country,
    state: normalized.state,
    city: normalized.city,
    target: normalized.target as number,
    sources: normalized.sources,
    searchAllLocalities: normalized.searchAllLocalities,
  };

  if (normalized.area) {
    config.area = normalized.area;
  }

  return { ok: true, config };
}

/** Human-readable scope line for the summary panel. */
export function describeSearchScope(config: {
  businessType: string;
  country: string;
  state: string;
  city: string;
  area: string;
  target: number | null;
}): string {
  const type = config.businessType.trim() || "businesses";
  const city = config.city.trim();
  const state = config.state.trim();
  const country = config.country.trim();
  const area = config.area.trim();
  const count =
    config.target !== null && Number.isFinite(config.target)
      ? config.target
      : null;

  const countLabel = count === null ? "…" : String(count);
  const typeLabel = type.toLowerCase();
  const place = [city, state, country].filter(Boolean).join(", ");

  if (!place) {
    return `You are searching for:\n${countLabel} ${typeLabel}\n(location not set)`;
  }

  if (area) {
    return `You are searching for:\n${countLabel} ${typeLabel}\nin ${area}, ${place}`;
  }

  return `You are searching for:\n${countLabel} ${typeLabel}\nacross ${place}`;
}

/**
 * BizScrape business record - mirrors documented CSV output fields.
 */

export type BusinessRecord = {
  id: string;
  company_name: string;
  website: string;
  email_primary: string;
  emails_all: string;
  phone_primary: string;
  phones_all: string;
  address: string;
  area: string;
  category: string;
  rating: string;
  review_count: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  /** Pipe-separated source ids (Google Maps: `gmaps`). */
  sources: string;
  maps_url: string;
  first_seen: string;
  last_enriched: string;
};

export function hasWebsite(record: BusinessRecord): boolean {
  return Boolean(record.website.trim());
}

export function hasEmail(record: BusinessRecord): boolean {
  return Boolean(record.email_primary.trim() || record.emails_all.trim());
}

export function hasPhone(record: BusinessRecord): boolean {
  return Boolean(record.phone_primary.trim() || record.phones_all.trim());
}

export function hasSocial(record: BusinessRecord): boolean {
  return Boolean(
    record.linkedin.trim() ||
      record.facebook.trim() ||
      record.instagram.trim(),
  );
}

export function primaryEmail(record: BusinessRecord): string {
  if (record.email_primary.trim()) {
    return record.email_primary.trim();
  }
  const first = record.emails_all
    .split(/[;,|]/)
    .map((part) => part.trim())
    .find(Boolean);
  return first ?? "";
}

export function websiteHostname(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").split("/")[0] ?? trimmed;
  }
}

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function formatSources(sources: string): string {
  return sources
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((id) => {
      if (id === "gmaps") return "Google Maps";
      return id;
    })
    .join(" · ");
}

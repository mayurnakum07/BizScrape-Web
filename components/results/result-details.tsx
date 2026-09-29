import { CopyButton } from "@/components/results/copy-button";
import { IconExternalLink } from "@/components/icons";
import {
  formatSources,
  hasEmail,
  hasPhone,
  hasSocial,
  hasWebsite,
  normalizeExternalUrl,
  primaryEmail,
  websiteHostname,
  type BusinessRecord,
} from "@/types/business-record";
import { cn } from "@/lib/cn";

type FieldStatus = "present" | "missing" | "unavailable";

type ResultDetailsProps = {
  record: BusinessRecord;
};

function fieldStatus(value: string, kind: "contact" | "meta" = "contact"): FieldStatus {
  if (value.trim()) {
    return "present";
  }
  return kind === "meta" ? "unavailable" : "missing";
}

function formatTimestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Structured business detail body for the results drawer.
 */
export function ResultDetails({ record }: ResultDetailsProps) {
  const email = primaryEmail(record);
  const website = record.website.trim();
  const phone = record.phone_primary.trim() || record.phones_all.trim();
  const maps = record.maps_url.trim();
  const sources = formatSources(record.sources);
  const firstSeen = formatTimestamp(record.first_seen);
  const lastEnriched = formatTimestamp(record.last_enriched);
  const emailHint =
    !record.email_primary.trim() && record.emails_all.trim()
      ? "Shown from emails_all (no primary set)"
      : !email
        ? "No public email found on the company site"
        : undefined;

  return (
    <div className="result-details flex flex-col gap-5 text-sm">
      <section aria-labelledby="detail-identity">
        <SectionHeading id="detail-identity">Identity</SectionHeading>
        <div className="mt-3 space-y-3">
          <IdentityBlock
            name={record.company_name}
            category={record.category}
            rating={record.rating}
            reviewCount={record.review_count}
          />
          <CoverageStrip record={record} />
        </div>
      </section>

      <section aria-labelledby="detail-contact">
        <SectionHeading id="detail-contact">Contact</SectionHeading>
        <div className="mt-2 space-y-2">
          <DetailRow
            label="Website"
            status={fieldStatus(website)}
            value={website}
            display={website ? websiteHostname(website) : undefined}
            href={website ? normalizeExternalUrl(website) : undefined}
            copyValue={website}
            missingLabel="No website found"
          />
          <DetailRow
            label="Email"
            status={fieldStatus(email)}
            value={email}
            href={email ? `mailto:${email}` : undefined}
            copyValue={email}
            hint={emailHint}
            missingLabel="No email found"
          />
          <DetailRow
            label="Phone"
            status={fieldStatus(phone)}
            value={phone}
            href={phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined}
            copyValue={phone}
            mono
            missingLabel="No phone found"
          />
        </div>
      </section>

      <section aria-labelledby="detail-location">
        <SectionHeading id="detail-location">Location</SectionHeading>
        <div className="mt-2 space-y-2">
          <DetailRow
            label="Area"
            status={fieldStatus(record.area)}
            value={record.area}
            copyValue={record.area}
            missingLabel="Area not set"
          />
          <DetailRow
            label="Address"
            status={fieldStatus(record.address)}
            value={record.address}
            copyValue={record.address}
            missingLabel="Address not available"
          />
          <DetailRow
            label="Maps"
            status={fieldStatus(maps)}
            value={maps}
            display={maps ? "Open in Maps" : undefined}
            href={maps ? normalizeExternalUrl(maps) : undefined}
            missingLabel="Maps link unavailable"
          />
        </div>
      </section>

      <section aria-labelledby="detail-social">
        <SectionHeading id="detail-social">Social</SectionHeading>
        <ul className="mt-2 flex flex-wrap gap-2">
          {record.linkedin.trim() ? (
            <SocialChip href={record.linkedin} label="LinkedIn" />
          ) : null}
          {record.facebook.trim() ? (
            <SocialChip href={record.facebook} label="Facebook" />
          ) : null}
          {record.instagram.trim() ? (
            <SocialChip href={record.instagram} label="Instagram" />
          ) : null}
          {!hasSocial(record) ? (
            <li className="detail-status-missing px-2.5 py-1.5 text-xs">
              No social links found
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="detail-source">
        <SectionHeading id="detail-source">Source & metadata</SectionHeading>
        <dl className="mt-2 grid gap-2">
          <MetaItem
            label="Sources"
            status={fieldStatus(sources, "meta")}
            value={sources || undefined}
            unavailableLabel="Source unavailable"
          />
          <MetaItem
            label="First seen"
            status={fieldStatus(firstSeen, "meta")}
            value={firstSeen || undefined}
            mono
            unavailableLabel="Not recorded"
          />
          <MetaItem
            label="Last enriched"
            status={fieldStatus(lastEnriched, "meta")}
            value={lastEnriched || undefined}
            mono
            unavailableLabel="Not recorded"
          />
          <MetaItem
            label="Record ID"
            status="present"
            value={record.id}
            mono
            copyValue={record.id}
          />
        </dl>
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: string;
}) {
  return (
    <h3
      id={id}
      className="font-mono text-[0.65rem] tracking-wide text-muted uppercase"
    >
      {children}
    </h3>
  );
}

function IdentityBlock({
  name,
  category,
  rating,
  reviewCount,
}: {
  name: string;
  category: string;
  rating: string;
  reviewCount: string;
}) {
  return (
    <div className="border border-border-subtle bg-elevated px-3 py-3">
      <p className="text-base font-medium text-foreground break-anywhere">
        {name.trim() || "Untitled business"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {category.trim() ? (
          <span className="border border-border-subtle px-2 py-0.5 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
            {category}
          </span>
        ) : (
          <span className="detail-status-missing px-2 py-0.5 text-xs">
            Category missing
          </span>
        )}
        {rating.trim() ? (
          <span className="font-mono text-xs tabular-nums text-foreground">
            {rating}
            <span className="text-muted">
              {" "}
              · {reviewCount || "0"} reviews
            </span>
          </span>
        ) : (
          <span className="detail-status-unavailable text-xs">
            Rating unavailable
          </span>
        )}
      </div>
    </div>
  );
}

function CoverageStrip({ record }: { record: BusinessRecord }) {
  const items = [
    { key: "website", label: "Website", ok: hasWebsite(record) },
    { key: "email", label: "Email", ok: hasEmail(record) },
    { key: "phone", label: "Phone", ok: hasPhone(record) },
    { key: "social", label: "Social", ok: hasSocial(record) },
  ] as const;

  return (
    <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.key}
          className={cn(
            "bg-surface px-2.5 py-2",
            item.ok ? "detail-status-present" : "detail-status-missing",
          )}
        >
          <p className="font-mono text-[0.65rem] tracking-wide uppercase opacity-80">
            {item.label}
          </p>
          <p className="mt-0.5 text-xs font-medium">
            {item.ok ? "Found" : "Missing"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function DetailRow({
  label,
  status,
  value,
  display,
  href,
  copyValue,
  hint,
  missingLabel,
  mono = false,
}: {
  label: string;
  status: FieldStatus;
  value: string;
  display?: string;
  href?: string;
  copyValue?: string;
  hint?: string;
  missingLabel: string;
  mono?: boolean;
}) {
  const shown = display ?? value;
  const present = status === "present" && value.trim();

  return (
    <div
      className={cn(
        "border px-3 py-2.5",
        present
          ? "border-border-subtle bg-elevated"
          : "border-dashed border-border bg-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
              {label}
            </p>
            <StatusBadge status={status} />
          </div>
          {present ? (
            href ? (
              <a
                href={href}
                target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
                rel={
                  href.startsWith("mailto:") || href.startsWith("tel:")
                    ? undefined
                    : "noopener noreferrer"
                }
                className={cn(
                  "mt-1 inline-flex max-w-full items-center gap-1.5 text-primary break-anywhere hover:underline",
                  mono && "font-mono text-xs tabular-nums",
                )}
                aria-label={
                  href.startsWith("mailto:") || href.startsWith("tel:")
                    ? `${label}: ${shown}`
                    : `${label}: ${shown}. Opens in a new tab.`
                }
              >
                <span className="min-w-0 break-anywhere">{shown}</span>
                {!href.startsWith("mailto:") && !href.startsWith("tel:") ? (
                  <>
                    <IconExternalLink size={12} className="shrink-0 opacity-70" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </>
                ) : null}
              </a>
            ) : (
              <p
                className={cn(
                  "mt-1 text-foreground break-anywhere",
                  mono && "font-mono text-xs",
                )}
              >
                {shown}
              </p>
            )
          ) : (
            <p
              className={cn(
                "mt-1 text-xs",
                status === "unavailable"
                  ? "detail-status-unavailable"
                  : "detail-status-missing",
              )}
            >
              {missingLabel}
            </p>
          )}
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {present && copyValue ? (
          <CopyButton value={copyValue} compact className="mt-0.5" />
        ) : null}
      </div>
    </div>
  );
}

function MetaItem({
  label,
  status,
  value,
  unavailableLabel,
  mono = false,
  copyValue,
}: {
  label: string;
  status: FieldStatus;
  value?: string;
  unavailableLabel?: string;
  mono?: boolean;
  copyValue?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border border-border-subtle px-3 py-2">
      <div className="min-w-0">
        <dt className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          {label}
        </dt>
        <dd
          className={cn(
            "mt-0.5 break-anywhere",
            status === "present"
              ? "text-foreground"
              : "detail-status-unavailable text-xs",
            mono && status === "present" && "font-mono text-xs",
          )}
        >
          {status === "present" ? value : unavailableLabel ?? "Unavailable"}
        </dd>
      </div>
      {status === "present" && copyValue ? (
        <CopyButton value={copyValue} compact />
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === "present") {
    return (
      <span className="detail-status-present font-mono text-[0.6rem] tracking-wide uppercase">
        Found
      </span>
    );
  }
  if (status === "unavailable") {
    return (
      <span className="detail-status-unavailable font-mono text-[0.6rem] tracking-wide uppercase">
        N/A
      </span>
    );
  }
  return (
    <span className="detail-status-missing font-mono text-[0.6rem] tracking-wide uppercase">
      Missing
    </span>
  );
}

function SocialChip({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={normalizeExternalUrl(href)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 border border-border bg-elevated px-2.5 py-1.5 text-xs text-foreground transition-ui hover:border-primary/40 hover:text-primary"
        aria-label={`${label}. Opens in a new tab.`}
      >
        {label}
        <IconExternalLink size={12} className="opacity-70" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

import { CopyButton } from "@/components/results/copy-button";
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

function displayValue(value: string): string {
  return value.trim() ? value : "—";
}

type ResultDetailsProps = {
  record: BusinessRecord;
};

export function ResultDetails({ record }: ResultDetailsProps) {
  const email = primaryEmail(record);
  const website = record.website.trim();
  const phone = record.phone_primary.trim() || record.phones_all.trim();

  return (
    <div className="flex flex-col gap-5 text-sm">
      <section>
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
          Business
        </h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <Detail label="Company" value={record.company_name} />
          <Detail label="Category" value={displayValue(record.category)} />
          <Detail label="Area" value={displayValue(record.area)} />
          <Detail label="Address" value={displayValue(record.address)} />
          <Detail
            label="Rating"
            value={
              record.rating.trim()
                ? `${record.rating} (${record.review_count || "0"} reviews)`
                : "—"
            }
          />
          <Detail label="Sources" value={formatSources(record.sources) || "—"} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
          Contact
        </h3>
        <div className="mt-2 space-y-2">
          <ContactRow
            label="Website"
            value={website}
            href={website ? normalizeExternalUrl(website) : undefined}
            display={website ? websiteHostname(website) : "—"}
            copyValue={website}
          />
          <ContactRow
            label="Email"
            value={email}
            href={email ? `mailto:${email}` : undefined}
            display={email || "—"}
            copyValue={email}
            hint={
              !record.email_primary.trim() && record.emails_all.trim()
                ? "Shown from emails_all (no primary set)"
                : !email
                  ? "No public email found on the company site"
                  : undefined
            }
          />
          <ContactRow
            label="Phone"
            value={phone}
            href={phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined}
            display={phone || "—"}
            copyValue={phone}
          />
          {record.maps_url.trim() ? (
            <ContactRow
              label="Maps"
              value={record.maps_url}
              href={normalizeExternalUrl(record.maps_url)}
              display="Open in Maps"
            />
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
          Social
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {record.linkedin.trim() ? (
            <SocialLink href={record.linkedin} label="LinkedIn" />
          ) : null}
          {record.facebook.trim() ? (
            <SocialLink href={record.facebook} label="Facebook" />
          ) : null}
          {record.instagram.trim() ? (
            <SocialLink href={record.instagram} label="Instagram" />
          ) : null}
          {!hasSocial(record) ? (
            <li className="text-muted">No social links found</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
          Coverage
        </h3>
        <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <li>{hasWebsite(record) ? "Website ✓" : "Website —"}</li>
          <li>{hasEmail(record) ? "Email ✓" : "Email —"}</li>
          <li>{hasPhone(record) ? "Phone ✓" : "Phone —"}</li>
          <li>{hasSocial(record) ? "Social ✓" : "Social —"}</li>
        </ul>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function ContactRow({
  label,
  value,
  display,
  href,
  copyValue,
  hint,
}: {
  label: string;
  value: string;
  display: string;
  href?: string;
  copyValue?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-background-elevated px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          {href && value ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-primary hover:underline"
              aria-label={`${label}: ${display}. Opens in a new tab.`}
            >
              {display}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <p className={cn("mt-0.5", !value && "text-muted")}>{display}</p>
          )}
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {copyValue ? <CopyButton value={copyValue} /> : null}
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={normalizeExternalUrl(href)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-ui hover:bg-surface-hover"
        aria-label={`${label}. Opens in a new tab.`}
      >
        {label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

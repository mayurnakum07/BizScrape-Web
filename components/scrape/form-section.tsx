import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type FormSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Compact labeled block inside the scrape query workspace.
 */
export function FormSection({
  id,
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("px-4 py-5 sm:px-5", className)}
    >
      <header className="mb-4">
        <h2
          id={headingId}
          className="font-mono text-[0.65rem] tracking-wide text-muted uppercase"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </header>
      <div className="field-group gap-5">{children}</div>
    </section>
  );
}

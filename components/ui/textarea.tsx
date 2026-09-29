import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({
  className,
  invalid,
  "aria-invalid": ariaInvalid,
  rows = 4,
  ...props
}: TextareaProps) {
  const isInvalid = invalid ?? ariaInvalid === true;

  return (
    <textarea
      rows={rows}
      aria-invalid={isInvalid || undefined}
      className={cn(
        "flex min-h-24 w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-foreground transition-ui",
        "placeholder:text-muted",
        "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isInvalid
          ? "border-error focus-visible:outline-error"
          : "border-border",
        className,
      )}
      {...props}
    />
  );
}

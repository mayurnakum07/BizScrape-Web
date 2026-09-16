import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({
  className,
  type = "text",
  invalid,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const isInvalid = invalid ?? ariaInvalid === true;

  return (
    <input
      type={type}
      aria-invalid={isInvalid || undefined}
      className={cn(
        "flex h-[var(--control-h-md)] w-full rounded-md border bg-surface px-3 text-sm text-foreground transition-ui",
        "placeholder:text-muted",
        "hover:border-border",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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

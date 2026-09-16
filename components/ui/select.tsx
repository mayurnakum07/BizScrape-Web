import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function Select({
  className,
  invalid,
  "aria-invalid": ariaInvalid,
  children,
  ...props
}: SelectProps) {
  const isInvalid = invalid ?? ariaInvalid === true;

  return (
    <select
      aria-invalid={isInvalid || undefined}
      className={cn(
        "flex h-[var(--control-h-md)] w-full appearance-none rounded-md border bg-surface px-3 pr-9 text-sm text-foreground transition-ui",
        "bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isInvalid
          ? "border-error focus-visible:outline-error"
          : "border-border",
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b939e' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

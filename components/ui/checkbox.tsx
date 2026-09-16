import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({
  className,
  id,
  label,
  description,
  disabled,
  ...props
}: CheckboxProps) {
  const inputId = id ?? props.name;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer gap-3 rounded-md",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        disabled={disabled}
        className={cn(
          "mt-0.5 size-4 shrink-0 rounded-sm border border-border bg-surface text-primary accent-primary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
        {...props}
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-sm text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

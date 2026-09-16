import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  optional?: boolean;
  hint?: ReactNode;
};

export function Label({
  className,
  optional,
  children,
  hint,
  ...props
}: LabelProps) {
  return (
    <label className={cn("text-label", className)} {...props}>
      <span className="inline-flex items-baseline gap-2">
        {children}
        {optional ? <span className="field-optional">Optional</span> : null}
      </span>
      {hint ? <span className="mt-1 block field-hint font-normal">{hint}</span> : null}
    </label>
  );
}

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  label?: string;
};

export function Divider({ className, label, ...props }: DividerProps) {
  if (!label) {
    return (
      <hr
        className={cn("border-0 border-t border-border-subtle", className)}
        {...props}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-label={label}
      className={cn("flex items-center gap-3 text-xs text-muted", className)}
    >
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="shrink-0 uppercase tracking-wide">{label}</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

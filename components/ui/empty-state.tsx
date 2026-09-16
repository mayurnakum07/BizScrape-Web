import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-background-elevated px-5 py-8",
        className,
      )}
    >
      {icon ? <div className="text-muted">{icon}</div> : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-section-heading">{title}</h3>
        {description ? <p className="max-w-md text-small">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

import type { ReactNode } from "react";

import { ErrorBanner } from "@/components/errors/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBlock } from "@/components/ui/feedback-states";
import { LoadingState } from "@/components/ui/feedback-states";
import {
  type WorkflowCopy,
  type WorkflowKind,
  workflowCopy,
} from "@/lib/workflow-state";
import { cn } from "@/lib/cn";

type WorkflowStatePanelProps = {
  kind: WorkflowKind;
  /** Override catalog copy when context-specific text is required. */
  copy?: Partial<WorkflowCopy>;
  actions?: ReactNode;
  className?: string;
  /** Prefer compact banner for inline workspace alerts. */
  variant?: "panel" | "banner" | "empty" | "loading";
};

/**
 * Consistent workflow state surface - title, explanation, next step, actions.
 */
export function WorkflowStatePanel({
  kind,
  copy: overrides,
  actions,
  className,
  variant,
}: WorkflowStatePanelProps) {
  const base = workflowCopy(kind);
  const resolved: WorkflowCopy = {
    ...base,
    ...overrides,
    kind,
    severity: overrides?.severity ?? base.severity,
  };

  const mode =
    variant ??
    (kind === "loading"
      ? "loading"
      : resolved.severity === "error"
        ? "panel"
        : kind.startsWith("empty") ||
            kind.startsWith("filtered") ||
            kind === "idb_not_found" ||
            kind === "not_found" ||
            kind === "job_not_found" ||
            kind === "export_empty"
          ? "empty"
          : resolved.severity === "warning" || resolved.severity === "success"
            ? "banner"
            : "panel");

  const description = [resolved.description, resolved.nextStep]
    .filter(Boolean)
    .join(" ");

  if (mode === "loading") {
    return (
      <LoadingState
        title={resolved.title}
        description={description}
        className={className}
      />
    );
  }

  if (mode === "banner") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <ErrorBanner
          severity={
            resolved.severity === "success"
              ? "success"
              : resolved.severity === "info"
                ? "info"
                : resolved.severity === "warning"
                  ? "warning"
                  : "error"
          }
          title={resolved.title}
          description={description}
        >
          {actions}
        </ErrorBanner>
      </div>
    );
  }

  if (mode === "panel" && resolved.severity === "error") {
    return (
      <ErrorBlock
        title={resolved.title}
        description={description}
        action={actions}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      title={resolved.title}
      description={description}
      action={actions}
      className={className}
      icon={
        resolved.eyebrow ? (
          <span className="font-mono text-[0.65rem] tracking-wide text-muted uppercase">
            {resolved.eyebrow}
          </span>
        ) : undefined
      }
    />
  );
}

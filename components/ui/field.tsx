import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export type FieldProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
};

/**
 * Form field convention: label above control, then hint or error.
 * Wires `htmlFor`, `aria-describedby`, and `aria-invalid` onto the child control.
 */
export function Field({
  id,
  label,
  children,
  optional,
  hint,
  error,
  className,
}: FieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const nextProps: Record<string, unknown> = {
      id,
      "aria-describedby": describedBy,
      "aria-invalid": error ? true : undefined,
      "aria-errormessage": errorId,
    };

    // Input / Textarea / Select understand `invalid` for visual error styles.
    if (
      typeof child.type === "function" ||
      typeof child.type === "object"
    ) {
      nextProps.invalid = Boolean(error);
    }

    return cloneElement(child as ReactElement<Record<string, unknown>>, nextProps);
  });

  return (
    <div className={cn("field", className)}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {control}
      {hintId ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

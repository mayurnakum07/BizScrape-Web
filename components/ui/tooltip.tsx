"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

/**
 * CSS-anchored tooltip. Prefer visible labels for critical actions.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby": open
          ? id
          : (children as ReactElement<{ "aria-describedby"?: string }>).props[
              "aria-describedby"
            ],
        onFocus: (event: FocusEvent) => {
          const original = (
            children as ReactElement<{ onFocus?: (e: FocusEvent) => void }>
          ).props.onFocus;
          original?.(event);
          setOpen(true);
        },
        onBlur: (event: FocusEvent) => {
          const original = (
            children as ReactElement<{ onBlur?: (e: FocusEvent) => void }>
          ).props.onBlur;
          original?.(event);
          setOpen(false);
        },
      })
    : children;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {trigger}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-[var(--z-tooltip)] w-max max-w-xs -translate-x-1/2 rounded-sm border border-border bg-elevated px-2 py-1 text-xs text-foreground shadow-sm",
            side === "top"
              ? "bottom-[calc(100%+0.35rem)]"
              : "top-[calc(100%+0.35rem)]",
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

export type TooltipContentProps = HTMLAttributes<HTMLSpanElement>;

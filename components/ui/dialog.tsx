"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

import { IconX } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Bottom sheet on narrow viewports (default true). */
  mobileSheet?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal using the native <dialog> element.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  mobileSheet = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (open && !node.open) {
      lastFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      node.showModal();
      requestAnimationFrame(() => {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        focusables?.[0]?.focus();
      });
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open && lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
    lastFocusedRef.current?.focus();
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "border border-border bg-surface p-0 text-foreground shadow-[var(--shadow-md)]",
        "backdrop:bg-black/60",
        "open:animate-[dialog-in_var(--duration-normal)_var(--ease-out)]",
        mobileSheet ? "dialog-sheet" : "m-auto w-[min(100%-2rem,28rem)] rounded-lg",
        className,
      )}
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === ref.current) {
          handleClose();
        }
      }}
    >
      <div ref={panelRef} className="flex max-h-[inherit] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-section-heading break-anywhere">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-small">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            label="Close dialog"
            size="sm"
            className="max-sm:min-h-11 max-sm:min-w-11"
            onClick={handleClose}
          >
            <IconX size={16} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}

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

export type DrawerSide = "right" | "left";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional controls rendered beside the close button (e.g. prev/next). */
  headerActions?: ReactNode;
  side?: DrawerSide;
  /** Wider panel for dense detail content. */
  size?: "md" | "lg";
  className?: string;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizeClasses: Record<"md" | "lg", string> = {
  md: "sm:max-w-[24rem]",
  lg: "sm:max-w-[28rem]",
};

/**
 * Side drawer on desktop; full-screen panel on narrow viewports.
 * Traps focus while open and restores it on close.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  headerActions,
  side = "right",
  size = "md",
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) {
      lastFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        const bodyFocusables =
          bodyRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        const panelFocusables =
          panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        const target = bodyFocusables?.[0] ?? panelFocusables?.[0];
        target?.focus();
      });
    } else {
      document.body.style.overflow = "";
      lastFocusedRef.current?.focus();
      lastFocusedRef.current = null;
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

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
  }, [open, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]" role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="drawer-backdrop absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "drawer-panel absolute flex flex-col border-border bg-surface text-foreground shadow-md",
          side === "right" ? "drawer-panel-right" : "drawer-panel-left",
          sizeClasses[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-section-heading break-anywhere">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-small break-anywhere">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <IconButton
              label="Close drawer"
              size="sm"
              className="max-sm:min-h-11 max-sm:min-w-11"
              onClick={handleClose}
            >
              <IconX size={16} />
            </IconButton>
          </div>
        </div>
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border-subtle px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

export type DialogSize = "md" | "lg" | "xl";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Bottom sheet on narrow viewports (default true). */
  mobileSheet?: boolean;
  size?: DialogSize;
  /**
   * When true (default), backdrop click does not close — use Close / Cancel.
   * Escape still closes via the native dialog unless prevented by the caller.
   */
  disableBackdropClose?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizeClasses: Record<DialogSize, string> = {
  md: "w-[min(100%-2rem,28rem)]",
  lg: "w-[min(100%-1.5rem,40rem)]",
  xl: "w-[min(100%-1rem,52rem)]",
};

/**
 * Accessible modal using the native <dialog> element.
 * Header/footer stay fixed; the body scrolls when content overflows.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  mobileSheet = true,
  size = "md",
  disableBackdropClose = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
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
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      document.body.style.overflow = "hidden";
      node.showModal();
      requestAnimationFrame(() => {
        const bodyFocusables =
          bodyRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        const panelFocusables =
          panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        const target = bodyFocusables?.[0] ?? panelFocusables?.[0];
        target?.focus();
      });
    } else if (!open && node.open) {
      node.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
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
  }, [onClose]);

  const handleNativeClose = useCallback(() => {
    document.body.style.overflow = "";
    onClose();
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "dialog-root z-[var(--z-modal)] border border-border bg-surface p-0 text-foreground shadow-md",
        "backdrop:bg-black/60",
        "open:animate-[dialog-in_var(--duration-fast)_var(--ease-out)]",
        mobileSheet
          ? cn("dialog-sheet", size !== "md" && "dialog-sheet-wide")
          : cn("m-auto", sizeClasses[size]),
        size === "lg" && mobileSheet && "sm:w-[min(100%-1.5rem,40rem)]",
        size === "xl" && mobileSheet && "sm:w-[min(100%-1rem,52rem)]",
        className,
      )}
      onClose={handleNativeClose}
      onClick={(event) => {
        if (disableBackdropClose) {
          return;
        }
        if (event.target === ref.current) {
          handleClose();
        }
      }}
    >
      <div ref={panelRef} className="dialog-panel">
        <div className="dialog-header flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-4 py-3 sm:px-5">
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
        <div ref={bodyRef} className="dialog-body px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer ? (
          <div className="dialog-footer shrink-0 border-t border-border-subtle px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

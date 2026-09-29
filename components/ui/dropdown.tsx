"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export type DropdownItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};

export type DropdownProps = {
  label: string;
  items: DropdownItem[];
  trigger?: ReactNode;
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
};

/**
 * Lightweight accessible menu for actions. Prefer Select for form values.
 */
export function Dropdown({
  label,
  items,
  trigger,
  align = "start",
  className,
  triggerClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const firstEnabled = items.findIndex((item) => !item.disabled);
      const target = itemRefs.current[firstEnabled >= 0 ? firstEnabled : 0];
      target?.focus();
    });

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, items]);

  function closeMenu(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function focusItem(index: number) {
    const enabledIndexes = items
      .map((item, i) => (item.disabled ? -1 : i))
      .filter((i) => i >= 0);
    if (enabledIndexes.length === 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    let target = enabledIndexes.find((i) => i >= clamped);
    if (target == null) {
      target = enabledIndexes[enabledIndexes.length - 1]!;
    }
    itemRefs.current[target]?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const currentIndex = itemRefs.current.findIndex(
      (node) => node === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(currentIndex < 0 ? 0 : currentIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
      return;
    }

    if (event.key === "Tab") {
      closeMenu(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        className={cn(
          "inline-flex h-[var(--control-h-md)] min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-ui",
          "hover:bg-surface-hover",
          "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          triggerClassName,
        )}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger ?? label}
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute top-full z-[var(--z-dropdown)] mt-1 min-w-44 overflow-hidden rounded-md border border-border bg-elevated py-1 shadow-md motion-menu-in",
            align === "end" ? "right-0" : "left-0",
          )}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item, index) => (
            <li key={item.id} role="presentation">
              <button
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={-1}
                className={cn(
                  "flex w-full px-3 py-2.5 text-left text-sm transition-ui",
                  "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                  "disabled:pointer-events-none disabled:opacity-50",
                  item.destructive
                    ? "text-error hover:bg-error-muted focus-visible:bg-error-muted"
                    : "text-foreground hover:bg-surface-hover focus-visible:bg-surface-hover",
                )}
                onClick={() => {
                  item.onSelect?.();
                  closeMenu(true);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export type DropdownTriggerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

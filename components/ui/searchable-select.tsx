"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/cn";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  id: string;
  name?: string;
  value: string;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-errormessage"?: string;
  onChange: (value: string) => void;
};

/**
 * Combobox-style searchable select matching BizScrape control styling.
 */
export function SearchableSelect({
  id,
  name,
  value,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  disabled = false,
  invalid = false,
  loading = false,
  required = false,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-errormessage": ariaErrorMessage,
  onChange,
}: SearchableSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selectOption = useCallback(
    (option: SearchableOption) => {
      onChange(option.value);
      setOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    },
    [onChange],
  );

  function closeList(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeList(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : Math.min(current + 1, filtered.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) {
        selectOption(option);
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-busy={loading || undefined}
        aria-invalid={invalid || ariaInvalid === true || ariaInvalid === "true" || undefined}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        onClick={() => {
          if (!disabled && !loading) {
            setOpen((current) => !current);
          }
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-[var(--control-h-md)] w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left text-sm transition-ui",
          "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-error" : "border-border hover:border-border",
          !selected && "text-muted",
        )}
      >
        <span className="min-w-0 truncate">
          {loading ? "Loading…" : selected?.label ?? placeholder}
        </span>
        <span className="shrink-0 text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-[var(--z-dropdown)] mt-1 w-full overflow-hidden rounded-md border border-border bg-elevated shadow-md motion-menu-in">
          <div className="border-b border-border-subtle p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                filtered[activeIndex]
                  ? `${optionIdPrefix}-option-${filtered[activeIndex]!.value}`
                  : undefined
              }
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            className="max-h-56 overflow-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">{emptyMessage}</li>
            ) : (
              filtered.map((option, index) => {
                const active = index === activeIndex;
                const chosen = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      id={`${optionIdPrefix}-option-${option.value}`}
                      type="button"
                      role="option"
                      aria-selected={chosen}
                      className={cn(
                        "flex w-full px-3 py-2.5 text-left text-sm transition-ui",
                        "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                        active || chosen
                          ? "bg-primary-muted text-foreground"
                          : "text-foreground hover:bg-surface-hover",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectOption(option)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

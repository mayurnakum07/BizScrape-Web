"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>");
  }
  return ctx;
}

export type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const baseId = useId();

  const setValue = useCallback(
    (next: string) => {
      if (controlled === undefined) {
        setUncontrolled(next);
      }
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const ctx = useMemo(
    () => ({ value, setValue, baseId }),
    [value, setValue, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  onKeyDown,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    ).filter((tab) => !tab.disabled);

    if (tabs.length === 0) {
      return;
    }

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const next = tabs[nextIndex];
    next?.focus();
    next?.click();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "inline-flex gap-1 border-b border-border-subtle",
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const { value: active, setValue, baseId } = useTabsContext();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "relative -mb-px min-h-10 border-b-2 px-3 py-2 text-sm font-medium transition-ui",
        "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
        selected
          ? "border-primary text-foreground"
          : "border-transparent text-muted hover:text-foreground",
        className,
      )}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: active, baseId } = useTabsContext();
  if (active !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn(
        "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

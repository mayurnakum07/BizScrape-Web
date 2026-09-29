"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { IconX } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export type ToastTone = "default" | "success" | "warning" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  default: "border-border bg-elevated text-foreground",
  success: "border-success/40 bg-elevated text-success",
  warning: "border-warning/40 bg-elevated text-warning",
  error: "border-error/40 bg-elevated text-error",
};

const DEFAULT_DURATION = 4500;

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const duration = toast.durationMs ?? DEFAULT_DURATION;
    if (duration <= 0) {
      return;
    }
    const timer = window.setTimeout(() => onDismiss(toast.id), duration);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 shadow-md",
        "motion-toast-in",
        toneClasses[toast.tone ?? "default"],
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm text-muted">{toast.description}</p>
        ) : null}
      </div>
      <IconButton
        label="Dismiss notification"
        size="sm"
        className="min-h-10 min-w-10"
        onClick={() => onDismiss(toast.id)}
      >
        <IconX size={14} />
      </IconButton>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: ToastInput) => {
    seq.current += 1;
    const id = `toast-${seq.current}`;
    setToasts((current) => [...current, { ...toast, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex flex-col items-end gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

/** Standalone toast list for demos without provider wiring. */
export function ToastDemoList({ items }: { items: ToastInput[] }) {
  const baseId = useId();
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div
          key={`${baseId}-${index}`}
          className={cn(
            "flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 shadow-md",
            toneClasses[item.tone ?? "default"],
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

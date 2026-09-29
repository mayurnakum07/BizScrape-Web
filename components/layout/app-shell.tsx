import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ToastifyProvider } from "@/lib/app-toast";

import { cn } from "@/lib/cn";

export type AppShellProps = {
  children: ReactNode;
  className?: string;
  /** Hide chrome on sparse pages (rare). */
  bare?: boolean;
};

/**
 * Global application shell: skip link, header, main workspace, footer.
 */
export function AppShell({ children, className, bare = false }: AppShellProps) {
  if (bare) {
    return (
      <ToastifyProvider>
        <div className={cn("min-h-dvh bg-background", className)}>
          {children}
        </div>
      </ToastifyProvider>
    );
  }

  return (
    <ToastifyProvider>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
        <a
          href="#main-content"
          className={cn(
            "absolute top-2 left-2 z-[var(--z-tooltip)] -translate-y-16 rounded-sm border border-border bg-elevated px-3 py-2 text-sm text-foreground shadow-sm transition-ui",
            "focus:translate-y-0 focus:outline focus:outline-[length:var(--focus-ring-width)] focus:outline-offset-[var(--focus-ring-offset)] focus:outline-primary",
          )}
        >
          Skip to content
        </a>
        <SiteHeader />
        <main
          id="main-content"
          className={cn("min-w-0 flex-1 outline-none", className)}
          tabIndex={-1}
        >
          {children}
        </main>
        <SiteFooter />
      </div>
    </ToastifyProvider>
  );
}

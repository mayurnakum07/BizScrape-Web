import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/cn";

export type AppShellProps = {
  children: ReactNode;
  className?: string;
  /** Hide chrome on sparse pages (rare). */
  bare?: boolean;
};

/**
 * Global application shell: header + main + footer.
 * Use for product pages, workflow, results, and docs.
 */
export function AppShell({ children, className, bare = false }: AppShellProps) {
  if (bare) {
    return <div className={cn("min-h-dvh bg-background", className)}>{children}</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main className={cn("min-w-0 flex-1", className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}

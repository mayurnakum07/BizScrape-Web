import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TerminalProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  children: ReactNode;
};

/**
 * Developer-tool surface for CLI examples, logs, and progress events.
 * Styling only — no scrape console behavior.
 */
export function Terminal({
  title = "Terminal",
  className,
  children,
  ...props
}: TerminalProps) {
  return (
    <div className={cn("terminal", className)} {...props}>
      <div className="terminal-header">
        <span>{title}</span>
      </div>
      <pre className="terminal-body">{children}</pre>
    </div>
  );
}

export function TerminalLine({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

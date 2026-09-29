import Link from "next/link";

import { githubNav, secondaryNav, workspaceNav } from "@/components/layout/nav-config";
import { Container } from "@/components/ui/container";
import {
  APP_COPYRIGHT_YEAR,
  APP_NAME,
  GITHUB_URL,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

const footerLinkClass =
  "text-muted transition-ui hover:text-foreground focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary";

/**
 * Compact application footer — utility strip, not a marketing block.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container
        size="wide"
        className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5"
      >
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <p className="font-mono text-xs font-medium tracking-wide text-foreground">
            {APP_NAME}
          </p>
          <span
            className="hidden h-3 w-px bg-border sm:block"
            aria-hidden="true"
          />
          <p className="text-xs text-muted">
            Local business discovery · enrich · CSV export
          </p>
          <span
            className="hidden h-3 w-px bg-border sm:block"
            aria-hidden="true"
          />
          <p className="text-xs text-muted">
            © {APP_COPYRIGHT_YEAR} · MIT
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
        >
          {workspaceNav.map((link) => (
            <Link key={link.href} href={link.href} className={footerLinkClass}>
              {link.label}
            </Link>
          ))}
          {secondaryNav.map((link) => (
            <Link key={link.href} href={link.href} className={footerLinkClass}>
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClass}
          >
            {githubNav.label}
          </a>
          <a
            href={`${GITHUB_URL}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(footerLinkClass)}
          >
            Documentation
          </a>
        </nav>
      </Container>
    </footer>
  );
}

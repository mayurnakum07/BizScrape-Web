import Link from "next/link";

import { Container } from "@/components/ui/container";
import {
  APP_COPYRIGHT_YEAR,
  APP_NAME,
  GITHUB_URL,
} from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border-subtle">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-mono text-sm font-medium text-foreground">
            {APP_NAME}
          </p>
          <p className="mt-2 text-sm text-muted">
            Open-source local business data tooling. Discover, enrich, and
            export structured CSV from a Python-powered pipeline.
          </p>
          <p className="mt-4 text-xs text-muted">
            © {APP_COPYRIGHT_YEAR} {APP_NAME} contributors. MIT License.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted sm:items-end">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-ui hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href={`${GITHUB_URL}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-ui hover:text-foreground"
          >
            Documentation
          </a>
          <Link
            href="/#how-it-works"
            className="transition-ui hover:text-foreground"
          >
            How it works
          </Link>
        </div>
      </Container>
    </footer>
  );
}

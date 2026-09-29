"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import {
  githubNav,
  isWorkspaceNavActive,
  secondaryNav,
  workspaceNav,
} from "@/components/layout/nav-config";
import { IconGithub, IconMenu, IconX } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { IconButton } from "@/components/ui/icon-button";
import { APP_NAME, SCRAPE_PATH } from "@/lib/constants";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function navItemClass(active: boolean, tone: "workspace" | "secondary" = "workspace") {
  return cn(
    "relative inline-flex items-center px-2.5 py-1.5 text-sm transition-ui",
    "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
    tone === "workspace" && "nav-underline",
    tone === "workspace" &&
      (active
        ? "font-medium text-foreground"
        : "text-muted hover:bg-surface hover:text-foreground"),
    tone === "secondary" && "text-muted hover:text-foreground",
  );
}

/**
 * Compact workspace chrome: brand, product nav with route state, secondary
 * anchors, GitHub, and lime primary CTA.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const menuFocusables = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      const toggle = menuButtonRef.current;
      const focusables = [
        ...(toggle ? [toggle] : []),
        ...menuFocusables,
      ];
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const firstLink = menuRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      firstLink?.focus();
      return;
    }

    if (wasOpenRef.current) {
      menuButtonRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-surface">
      <Container
        size="wide"
        className="flex h-[var(--header-height)] items-center gap-3 sm:gap-4"
      >
        <Link
          href="/"
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 font-mono text-sm font-medium tracking-wide text-foreground transition-ui",
            "hover:text-primary",
            "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          )}
          onClick={() => setOpen(false)}
        >
          <span
            className="size-2 shrink-0 bg-primary transition-ui group-hover:opacity-90"
            aria-hidden="true"
          />
          {APP_NAME}
        </Link>

        <nav
          aria-label="Workspace"
          className="hidden min-w-0 items-center md:flex"
        >
          <div className="flex items-center gap-0.5 border-l border-border-subtle pl-3">
            {workspaceNav.map((link) => {
              const active = isWorkspaceNavActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                  className={navItemClass(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          <nav aria-label="Secondary" className="flex items-center gap-0.5">
            {secondaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navItemClass(false, "secondary")}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={githubNav.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open BizScrape GitHub repository in a new tab"
              className={cn(
                navItemClass(false, "secondary"),
                "inline-flex items-center gap-1.5",
              )}
            >
              <IconGithub size={14} />
              {githubNav.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </nav>

          <div className="ml-2 border-l border-border-subtle pl-3">
            <Link
              href={SCRAPE_PATH}
              className={buttonClassName({ size: "sm" })}
            >
              Start scraping
            </Link>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href={SCRAPE_PATH}
            className={buttonClassName({ size: "sm" })}
            onClick={() => setOpen(false)}
          >
            Start scraping
          </Link>
          <IconButton
            ref={menuButtonRef}
            label={open ? "Close menu" : "Open menu"}
            size="sm"
            variant="outline"
            className="max-md:min-h-11 max-md:min-w-11"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconX size={16} /> : <IconMenu size={16} />}
          </IconButton>
        </div>
      </Container>

      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="drawer-backdrop fixed inset-0 top-[var(--header-height)] z-[calc(var(--z-sticky)-10)] bg-black/55 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav
        id={menuId}
        ref={menuRef}
        aria-label="Mobile"
        hidden={!open}
        className={cn(
          "relative z-[var(--z-sticky)] border-t border-border bg-elevated md:hidden",
          open && "motion-panel-in block",
        )}
      >
        <Container size="wide" className="flex flex-col gap-4 py-4">
          <div>
            <p className="px-2.5 font-mono text-xs tracking-wide text-muted uppercase">
              Workspace
            </p>
            <div className="mt-1 flex flex-col">
              {workspaceNav.map((link) => {
                const active = isWorkspaceNavActive(link.href, pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-sm px-2.5 py-2.5 text-sm transition-ui",
                      active
                        ? "bg-primary-muted font-medium text-foreground"
                        : "text-foreground hover:bg-surface",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border-subtle pt-3">
            <p className="px-2.5 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
              Resources
            </p>
            <div className="mt-1 flex flex-col">
              {secondaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm px-2.5 py-2.5 text-sm text-muted transition-ui hover:bg-surface hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={githubNav.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open BizScrape GitHub repository in a new tab"
                className="inline-flex items-center gap-2 rounded-sm px-2.5 py-2.5 text-sm text-muted transition-ui hover:bg-surface hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <IconGithub size={15} />
                {githubNav.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </Container>
      </nav>
    </header>
  );
}

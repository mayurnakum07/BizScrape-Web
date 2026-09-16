"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { IconGithub, IconMenu, IconX } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { IconButton } from "@/components/ui/icon-button";
import {
  APP_NAME,
  GITHUB_URL,
  SCRAPE_PATH,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/scrape/history", label: "History" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#open-source", label: "Open source" },
] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Product header: brand, in-page anchors, GitHub, and Start scraping CTA.
 * Mobile menu collapses cleanly without a heavy nav pattern.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) {
        return;
      }

      const focusables = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
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
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/90 backdrop-blur-sm">
      <Container className="flex h-[var(--header-height)] items-center justify-between gap-4">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-wide text-foreground transition-ui hover:text-primary"
          onClick={() => setOpen(false)}
        >
          {APP_NAME}
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted transition-ui hover:bg-surface hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open BizScrape GitHub repository in a new tab"
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted transition-ui hover:bg-surface hover:text-foreground"
          >
            <IconGithub size={15} />
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link
            href={SCRAPE_PATH}
            className={cn(buttonClassName({ size: "sm" }), "ml-2")}
          >
            Start scraping
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
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
          className="fixed inset-0 top-[var(--header-height)] z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav
        id={menuId}
        ref={menuRef}
        aria-label="Mobile"
        hidden={!open}
        className={cn(
          "relative z-40 border-t border-border-subtle bg-background md:hidden",
          open && "block",
        )}
      >
        <Container className="flex flex-col gap-1 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-3 text-sm text-foreground transition-ui hover:bg-surface"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open BizScrape GitHub repository in a new tab"
            className="inline-flex items-center gap-2 rounded-md px-3 py-3 text-sm text-foreground transition-ui hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <IconGithub size={15} />
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Container>
      </nav>
    </header>
  );
}

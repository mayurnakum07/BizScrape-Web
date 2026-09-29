/**
 * @vitest-environment jsdom
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/layout/site-header";
import { isWorkspaceNavActive } from "@/components/layout/nav-config";

const pathnameRef = { current: "/" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

afterEach(() => {
  cleanup();
  pathnameRef.current = "/";
});

describe("isWorkspaceNavActive", () => {
  it("marks scrape workspace routes without history", () => {
    expect(isWorkspaceNavActive("/scrape", "/scrape")).toBe(true);
    expect(isWorkspaceNavActive("/scrape", "/scrape/job/abc")).toBe(true);
    expect(isWorkspaceNavActive("/scrape", "/scrape/history")).toBe(false);
    expect(isWorkspaceNavActive("/scrape/history", "/scrape/history")).toBe(
      true,
    );
    expect(
      isWorkspaceNavActive("/scrape/history", "/scrape/history/id-1"),
    ).toBe(true);
  });
});

describe("SiteHeader mobile navigation", () => {
  it("opens and closes the mobile menu", () => {
    render(<SiteHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const menuId = toggle.getAttribute("aria-controls");
    expect(menuId).toBeTruthy();
    const menu = document.getElementById(menuId!);
    expect(menu).toBeTruthy();
    expect(
      within(menu!).getByRole("link", { name: "How it works" }),
    ).toBeVisible();
    expect(within(menu!).getByRole("link", { name: "Scrape" })).toBeVisible();
    expect(within(menu!).getByRole("link", { name: "History" })).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when Escape is pressed", () => {
    render(<SiteHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the active workspace route", () => {
    pathnameRef.current = "/scrape/history";
    render(<SiteHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const historyLinks = screen.getAllByRole("link", { name: "History" });
    expect(historyLinks.length).toBeGreaterThan(0);
    for (const link of historyLinks) {
      expect(link).toHaveAttribute("aria-current", "page");
    }

    const scrapeLinks = screen.getAllByRole("link", { name: "Scrape" });
    for (const link of scrapeLinks) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});

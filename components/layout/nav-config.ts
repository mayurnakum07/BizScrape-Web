import { GITHUB_URL, SCRAPE_PATH } from "@/lib/constants";

export type NavLink = {
  href: string;
  label: string;
  /** When true, opens in a new tab (external). */
  external?: boolean;
};

/** Primary workspace destinations — current route is highlighted. */
export const workspaceNav: NavLink[] = [
  { href: SCRAPE_PATH, label: "Scrape" },
  { href: "/scrape/history", label: "History" },
];

/** Marketing / orientation anchors kept available but visually secondary. */
export const secondaryNav: NavLink[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#open-source", label: "Open source" },
];

export const githubNav: NavLink = {
  href: GITHUB_URL,
  label: "GitHub",
  external: true,
};

/**
 * Active match for workspace routes.
 * Scrape covers configure + live job + results; History covers local history.
 */
export function isWorkspaceNavActive(href: string, pathname: string): boolean {
  if (href === SCRAPE_PATH) {
    if (pathname.startsWith("/scrape/history")) {
      return false;
    }
    return pathname === SCRAPE_PATH || pathname.startsWith("/scrape/");
  }

  if (href === "/scrape/history") {
    return pathname.startsWith("/scrape/history");
  }

  return pathname === href;
}

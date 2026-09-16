/**
 * Tailwind-aligned breakpoints (min-width). Keep in sync with utility classes:
 * sm · md · lg · xl · 2xl
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Responsive presentation classes shared by results views. */
export const RESULTS_TABLE_CLASSES = "hidden overflow-hidden rounded-lg border border-border md:block";
export const RESULTS_CARDS_CLASSES = "grid gap-3 md:hidden";

export function matchesMinWidth(width: number, breakpoint: BreakpointKey): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

export function isMobileViewport(width: number): boolean {
  return width < BREAKPOINTS.md;
}

export function isDesktopViewport(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

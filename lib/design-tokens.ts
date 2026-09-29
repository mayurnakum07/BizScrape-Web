/**
 * BizScrape design tokens — TypeScript mirror of `app/globals.css` `:root`.
 * Prefer CSS variables / Tailwind theme classes in components.
 * Use this module for docs, tests, and non-CSS consumers.
 */

export const colors = {
  canvas: "#0B0D0C",
  surface: "#111513",
  elevated: "#171C18",
  border: "#29302B",
  foreground: "#E7EAE4",
  muted: "#89918A",
  signal: "#C8F04A",
  success: "#76D6A0",
  warning: "#E6B85C",
  error: "#FF7568",
} as const;

export const typography = {
  fontSans: "var(--font-sans)",
  fontMono: "var(--font-mono)",
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  leading: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
  },
} as const;

export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

/** Sharp, controlled geometry — keep radii minimal. */
export const radii = {
  none: "0",
  sm: "0.125rem",
  md: "0.25rem",
  lg: "0.375rem",
  xl: "0.5rem",
} as const;

export const shadows = {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.45)",
  md: "0 4px 16px rgba(0, 0, 0, 0.5)",
} as const;

export const transitions = {
  durationFast: "120ms",
  durationNormal: "180ms",
  durationSlow: "280ms",
  /** Subtle live loops for running scrape state only. */
  durationLive: "1.25s",
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const zIndex = {
  base: 0,
  sticky: 40,
  dropdown: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
  tooltip: 90,
} as const;

export const focus = {
  ringWidth: "2px",
  ringOffset: "2px",
  ringColor: colors.signal,
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
  zIndex,
  focus,
} as const;

export type DesignTokens = typeof designTokens;

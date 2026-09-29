# Design system

BizScrape Web uses a **dark-first**, restrained, developer-focused visual language.

**Direction:** deep blue-black canvas · subtle elevated surfaces · electric lime signal · sharp geometry · no gradients, glassmorphism, glow, or decorative SaaS styling.

## Principles

1. Hierarchy from spacing, typography, contrast, and borders — not glow or heavy shadow.
2. One interaction/data signal (electric lime); success / warning / error used sparingly.
3. IBM Plex Sans for UI copy; IBM Plex Mono for metrics, logs, IDs, and scraped data.
4. Motion only for state change, loading, and feedback — respect `prefers-reduced-motion`.
5. Tokens live in `app/globals.css` (CSS) and `lib/design-tokens.ts` (TS mirror). Components consume semantic classes / CSS variables.

## Color palette

| Role | Hex | Token |
|------|-----|-------|
| Canvas | `#0B0D0C` | `--background` / `--canvas` |
| Surface | `#111513` | `--surface` |
| Elevated | `#171C18` | `--elevated` / `--background-elevated` |
| Border | `#29302B` | `--border` |
| Primary text | `#E7EAE4` | `--foreground` |
| Muted text | `#89918A` | `--muted` |
| Signal | `#C8F04A` | `--primary` / `--signal` |
| Success | `#76D6A0` | `--success` |
| Warning | `#E6B85C` | `--warning` |
| Error | `#FF7568` | `--error` |

## Token groups

| Group | Examples |
|-------|----------|
| Colors | surfaces, signal, status, terminal |
| Typography | `--font-sans`, `--font-mono`, size / leading scales; utilities `.text-display`, `.text-metric`, `.text-code` |
| Spacing | `--space-1` … `--space-24` |
| Borders | `--border`, `--border-subtle`, `--border-width` |
| Radii | `--radius-sm` (2px) … `--radius-xl` (8px) — keep minimal |
| Shadows | `--shadow-sm`, `--shadow-md` — flat elevation only |
| Transitions | `--duration-fast|normal|slow`, `--ease-out`; utility `.transition-ui` |
| Z-index | `--z-sticky` → `--z-tooltip` |
| Focus | `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color` |

## Primitives (`components/ui`)

Buttons, inputs, selects (incl. searchable), badges/status, tabs, dropdowns, tooltips, dialogs, drawers, progress, tables, empty / loading / error panels, toast notifications, terminal, cards, skeleton, spinner.

## Shell

`AppShell` → skip link + `ToastProvider` + `SiteHeader` + `#main-content` + `SiteFooter`.

- Header is a compact workspace bar on `--surface` (no blur/glass).
- Workspace nav: **Scrape**, **History** with `aria-current` / lime underline when active.
- Secondary anchors (How it works, Open source) and GitHub stay available but quieter.
- Primary CTA **Start scraping** uses the lime signal button.
- Footer is a dense utility strip, not a marketing block.
- Chrome containers use `size="wide"` with tighter `--container-pad` / `--header-height`.

## Reference

Internal page: [`/design-system`](/design-system)

## Icons

Stroke icons in `components/icons` — geometric, 1.75 stroke. Do not mix icon libraries.

## Deferred

- Light theme toggle (token architecture allows `[data-theme="light"]` later)
- Page-level visual redesigns (later milestones consume this foundation)

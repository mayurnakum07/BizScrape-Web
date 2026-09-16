# Design system

BizScrape Web uses a **dark-first**, restrained, developer-focused visual language.

## Principles

1. Hierarchy from spacing, typography, contrast, and borders — not glow or heavy shadow.
2. One accent (restrained blue); status colors sparingly.
3. IBM Plex Sans for UI; IBM Plex Mono for commands, logs, and technical metadata.
4. Motion only for state change, loading, and feedback — respect `prefers-reduced-motion`.
5. Tokens live in `app/globals.css`. Components consume semantic classes / CSS variables.

## Tokens

| Token | Role |
|-------|------|
| `--background` | Page canvas |
| `--background-elevated` | Slightly lifted regions |
| `--surface` | Cards, panels, controls |
| `--foreground` / `--muted` | Primary / secondary text |
| `--border` / `--border-subtle` | Separators |
| `--primary` | Accent actions |
| `--success` / `--warning` / `--error` / `--info` | Status |

Spacing: `--space-1` … `--space-24`. Radius: `--radius-sm|md|lg|xl` (restrained).

## Shell

`AppShell` → `SiteHeader` + `main` + `SiteFooter`.

Navigation stays minimal until product routes exist. Do not invent fake nav destinations.

## Reference

Internal page: [`/design-system`](/design-system)

## Icons

Stroke icons in `components/icons` — geometric, 1.75 stroke. Do not mix icon libraries.

## Deferred

- Light theme toggle (token architecture allows `[data-theme="light"]` later)
- Full scrape form / console / results table (Milestones 03–05)
- Dropdown menus, tooltips, switch — add when a screen needs them

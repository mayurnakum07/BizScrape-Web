# Coding conventions

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| React components | PascalCase file + export | `button.tsx` → `Button` |
| Utilities / hooks | camelCase | `cn.ts`, `useScrapeProgress.ts` |
| Types | PascalCase | `ScrapeJob` |
| Env vars | `SCREAMING_SNAKE` | `NEXT_PUBLIC_API_URL` |
| CSS variables | kebab-case | `--primary` |

UI primitive files under `components/ui/` use lowercase kebab or single-word names matching the export (`button.tsx`, `loading-indicator.tsx`).

## TypeScript

- Strict mode is required (`strict`, `noUncheckedIndexedAccess`).
- Prefer explicit prop types colocated with the component.
- Shared domain types live in `types/`.
- Avoid `any`; use `unknown` and narrow.

## Imports

- Use the `@/` path alias.
- Prefer named exports for components and utilities.
- Keep import groups readable: external → internal `@/` → relative.

## Server vs client components

- Default to Server Components.
- Add `"use client"` only for interactivity, browser APIs, or hooks.
- Fetch data on the server when possible; call `services/` from client only when necessary.

## Components

- Put generic primitives in `components/ui/`.
- Put layout chrome in `components/layout/`.
- Put icons in `components/icons/` (one stroke style).
- Put feature UI next to the feature when those milestones arrive.
- Avoid wrapper components that only forward props without adding meaning.
- Follow [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for visual rules.

## Services & API

- Network calls go through `services/` (see `services/api.ts`).
- Never scrape or parse business sites in the browser.
- Surface failures with `AppError` / `getErrorMessage` from `lib/errors.ts`.

## Environment variables

- Document every variable in `.env.example`.
- Browser code may only read `NEXT_PUBLIC_*`.
- Use `lib/env.ts` helpers instead of scattering `process.env` reads.

## Errors

- User-facing copy stays calm and non-technical.
- Log details with `console.error` in error boundaries; do not dump stacks into the UI.

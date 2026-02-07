# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Apply schema changes to Neon Postgres (no migrations, push-only)
npm run db:seed      # Seed all 11 weekends (tsx src/db/seed.ts)
npm run db:studio    # Drizzle Studio GUI
npx shadcn add <component>  # Add a shadcn/ui component
```

Environment: requires `DATABASE_URL` in `.env.local` pointing to a Neon Postgres instance. Deployed on Vercel (push to `main` triggers deploy).

## Architecture

Next.js 16 app using the App Router with React 19, TypeScript, Tailwind CSS 4, and Drizzle ORM against Neon serverless Postgres.

**No tests exist.** No test framework is configured.

### Data flow

Server Components fetch data via `src/lib/queries.ts` → render UI → client components call Server Actions in `src/lib/actions.ts` for mutations → `revalidatePath()` invalidates cache. Client components use `useOptimistic` for instant feedback before server confirmation.

### Key directories

- `src/app/(dashboard)/` — Route group: overview page (`page.tsx`) and `weekend/[id]/` detail page
- `src/components/weekend/` — Domain components (cards, grid, notes editor, scorecard, charts)
- `src/components/ui/` — shadcn/ui primitives (card, badge, checkbox, chart, etc.)
- `src/lib/` — `db.ts` (Drizzle client), `queries.ts` (reads), `actions.ts` (mutations), `suggestions.ts` (recommendation engine), `hooks/` (debounce, celebration)
- `src/db/schema.ts` — 4 tables: `weekends`, `workItems`, `doneCriteria`, `scorecardRatings`
- `src/db/seed.ts` — Seeds all weekend data

### Domain model

A **weekend** has many **workItems** (core and advanced). Weekend completion is derived: a weekend is complete when ALL core (`isAdvanced === false`) work items are checked. Advanced items don't affect completion. The `completedAt` timestamp on weekends is auto-managed by `toggleWorkItem` — never set manually.

Weekends belong to categories (`foundation`, `core_projects`, `automation`, `system_and_build`, `bonus`). The suggestion engine in `suggestions.ts` recommends the next weekend respecting category dependency order.

**Scorecard ratings** use an upsert pattern with a unique constraint on `(weekendId, criterion)`. Scorecards are only shown for completed weekends.

### Patterns to follow

- **Server-first**: default to Server Components; only add `"use client"` when interactivity is needed
- **Server Actions**: all mutations go through `"use server"` functions in `actions.ts` with Zod validation at the entry point
- **Optimistic UI**: use `useOptimistic` + `useTransition` for toggles/mutations, with server truth as fallback
- **Auto-save**: notes use 1-second debounce (custom `useDebouncedCallback` hook in `src/lib/hooks/use-debounce.ts`) with saving/saved status indicators
- **Animations**: Motion library (not framer-motion) for spring physics, staggered entrances, page transitions; always support `prefers-reduced-motion`
- **Dynamic imports**: heavy client-only components (charts) use `next/dynamic` with `ssr: false`
- **Path alias**: `@/*` maps to `./src/*`
- **shadcn/ui**: New York style, Zinc color palette, uses `cn()` from `src/lib/utils.ts` for class merging

### Gotchas

- **No migrations directory**: this project uses `db:push` (schema push) only — there is no `migrations/` folder. Edit `src/db/schema.ts` and run `npm run db:push`.
- **`params` is a Promise**: Next.js 16 changed dynamic route params to async. In page/layout components, always `const { id } = await params;` — not destructuring directly.
- **Overview page is `force-dynamic`**: `src/app/(dashboard)/page.tsx` exports `const dynamic = "force-dynamic"` to bypass static caching. New pages that read from the DB should do the same.
- **Hooks path mismatch**: `components.json` aliases `hooks` to `@/hooks`, but custom hooks live at `src/lib/hooks/`. If shadcn generates a hook import using `@/hooks`, move the file or fix the import to `@/lib/hooks/`.

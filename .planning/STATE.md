# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** A single place to see where I am in the 10-weekend program and what to do next -- simple enough that I actually use it.
**Current focus:** Phase 4 in progress: Weekly Scorecard data layer complete (schema, Server Actions, query). UI composition next in Plan 02.

## Current Position

Phase: 4 of 6 (Weekly Scorecard)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-07 -- Completed 04-01-PLAN.md (Scorecard Data Layer + UI Primitives)

Progress: [█████████░░░░░░] 60% (9/15 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: ~3 min
- Total execution time: ~26 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-data-layer | 3/3 | ~12 min | ~4 min |
| 02-weekend-overview | 2/2 | ~5 min | ~2.5 min |
| 03-core-interactions | 2/2 | ~4 min | ~2 min |
| 04-weekly-scorecard | 1/2 | ~3 min | ~3 min |

**Recent Trend:**
- Last 5 plans: 02-02, 03-01, 03-02, 04-01
- Trend: consistent ~2-3 min/plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Server-first architecture (Server Components + Server Actions) established from Phase 1, not retrofitted later
- [Roadmap]: Neon Postgres + Drizzle ORM chosen over Supabase/Prisma for serverless performance and scale-to-zero
- [01-01]: Used shadcn/ui Nova style with Zinc base color for Apple-inspired aesthetic
- [01-01]: Used @neondatabase/serverless HTTP driver (not pg) for serverless-compatible connection
- [01-01]: Used generatedAlwaysAsIdentity() instead of deprecated serial() for primary keys
- [01-01]: Used drizzle-kit push workflow (no migration files) for initial development
- [01-01]: Defined pgEnum for weekend categories to enforce valid values at database level
- [01-02]: Standalone Neon+Drizzle connection in seed script (not importing lib/db.ts) for tsx execution outside Next.js
- [01-02]: Identity sequences reset with COALESCE(MAX(id), 1) after seeding
- [01-02]: Bonus weekend stored as number=11, isBonus=true
- [01-03]: Pure neutral zinc palette (zero chroma oklch) for Apple-minimalist aesthetic
- [01-03]: Inter font replaces Geist for cleaner Apple-like typography
- [01-03]: Weekend list grouped by category with dividers, zero-padded numbers
- [01-03]: DATABASE_URL configured on Vercel for production and preview environments
- [02-01]: Drizzle relational query API (db.query.*) with selective columns for overview efficiency
- [02-01]: WeekendWithWorkItems type derived from query return type (no separate types file)
- [02-01]: Status derived from work items in component (completed/in_progress/not_started)
- [02-01]: Phase 1 landing page removed, replaced with (dashboard) route group overview
- [02-01]: Skeleton card counts match actual category sizes to minimize layout shift
- [02-02]: WeekendDetail type derived from NonNullable<Awaited<ReturnType<typeof getWeekendById>>> for schema sync
- [02-02]: Advanced modifiers rendered inline with muted styling for visual de-emphasis
- [02-02]: Next.js 16 async params pattern: params is Promise, must be awaited
- [03-01]: react-markdown v10 (latest) instead of v9 -- current version, React 19 compatible
- [03-01]: Custom debounce hook (35 lines) instead of use-debounce package -- avoids dependency for single use case
- [03-01]: Zod v4 for Server Action input validation -- already a project dependency
- [03-01]: Server Actions pattern: 'use server' directive, zod validation, revalidatePath after mutation
- [03-01]: Atomic toggle: Drizzle not() for single-SQL boolean flip, no read-then-write
- [03-01]: Derived completion: Weekend completedAt set/cleared based on core work item state
- [03-02]: WorkItemRow and WorkItemList are Client Components for useOptimistic/useTransition hooks
- [03-02]: WeekendDetail stays a Server Component, passes data to Client children
- [03-02]: Section headings moved from WorkItemList to WeekendDetail for cleaner separation
- [03-02]: Done criteria remain read-only icons, not interactive checkboxes
- [04-01]: Drizzle third-arg callback pattern for composite unique constraint on scorecardRatings
- [04-01]: Strict zod enum for criterion values (outcome_quality, time_saved, repeatability, use_again)
- [04-01]: Rating validated as integer 0-5 despite real DB column for star-rating semantics
- [04-01]: onConflictDoUpdate upsert pattern for deduplication on composite keys

### Pending Todos

None.

### Blockers/Concerns

None.

## Key Artifacts

- **Production URL:** https://ai-resolution.vercel.app
- **Database:** Neon Postgres with 11 weekends, 80 work items, 11 done criteria, unique constraint on scorecard_ratings
- **Design system:** Apple-minimalist tokens in src/app/globals.css
- **Query layer:** src/lib/queries.ts (getWeekendsWithProgress, getWeekendById with scorecardRatings)
- **Mutation layer:** src/lib/actions.ts (toggleWorkItem, saveNotes, saveRating, saveScorecardNotes)
- **Debounce hook:** src/lib/hooks/use-debounce.ts (useDebouncedCallback)
- **Overview page:** src/app/(dashboard)/page.tsx with loading skeleton
- **Detail page:** src/app/(dashboard)/weekend/[id]/page.tsx with loading skeleton and 404 handling
- **Detail components:** src/components/weekend/weekend-detail.tsx (Server), work-item-list.tsx (Client), work-item-row.tsx (Client), notes-editor.tsx (Client)
- **UI components:** badge, card, progress, skeleton, checkbox, textarea, toggle-group, switch, label

## Session Continuity

Last session: 2026-02-07T19:42Z
Stopped at: Completed 04-01-PLAN.md -- Scorecard Data Layer + UI Primitives
Resume file: None

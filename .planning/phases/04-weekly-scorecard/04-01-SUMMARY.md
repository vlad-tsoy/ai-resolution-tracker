---
phase: 04-weekly-scorecard
plan: 01
subsystem: database, api
tags: [drizzle, neon, server-actions, zod, shadcn-ui, upsert, unique-constraint]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    provides: "Neon Postgres + Drizzle schema with scorecardRatings table and relations"
  - phase: 03-core-interactions
    provides: "Server Actions pattern (toggleWorkItem, saveNotes) and zod validation"
provides:
  - "Unique constraint on scorecardRatings(weekendId, criterion) enabling upserts"
  - "scorecardNotes column on weekends table"
  - "saveRating Server Action with onConflictDoUpdate upsert"
  - "saveScorecardNotes Server Action"
  - "getWeekendById returns scorecardRatings in response"
  - "shadcn/ui ToggleGroup, Switch, Label components installed"
affects: [04-02-scorecard-ui]

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-toggle-group", "@radix-ui/react-switch", "@radix-ui/react-label"]
  patterns: ["onConflictDoUpdate upsert for unique constraint", "Zod enum validation for criterion values"]

key-files:
  created:
    - src/components/ui/toggle-group.tsx
    - src/components/ui/toggle.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/label.tsx
  modified:
    - src/db/schema.ts
    - src/lib/actions.ts
    - src/lib/queries.ts

key-decisions:
  - "Used drizzle third-arg callback pattern for composite unique constraint"
  - "Strict zod enum for criterion values: outcome_quality, time_saved, repeatability, use_again"
  - "Rating validated as integer 0-5 despite real DB column for UI star-rating semantics"

patterns-established:
  - "Upsert pattern: insert().values().onConflictDoUpdate() for deduplication on composite keys"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 4 Plan 1: Scorecard Data Layer Summary

**Unique constraint + scorecardNotes column pushed to Neon, saveRating upsert and saveScorecardNotes Server Actions, getWeekendById returns scorecardRatings, ToggleGroup/Switch/Label installed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T19:39:25Z
- **Completed:** 2026-02-07T19:42:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added composite unique constraint on scorecardRatings(weekendId, criterion) enabling conflict-free upserts
- Added scorecardNotes text column to weekends table for per-weekend scorecard notes
- Created saveRating Server Action using onConflictDoUpdate for idempotent rating persistence
- Created saveScorecardNotes Server Action for scorecard-specific notes
- Updated getWeekendById to include scorecardRatings in relational query response
- Installed shadcn/ui ToggleGroup, Switch, and Label components for Plan 02 UI composition

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema changes and shadcn/ui component installation** - `c7ee3ee` (feat)
2. **Task 2: Server Actions and query update for scorecard** - `adc349c` (feat)

## Files Created/Modified
- `src/db/schema.ts` - Added unique import, scorecardNotes column, composite unique constraint callback
- `src/lib/actions.ts` - Added saveRating (upsert) and saveScorecardNotes Server Actions with zod validation
- `src/lib/queries.ts` - Added scorecardRatings: true to getWeekendById with clause
- `src/components/ui/toggle-group.tsx` - shadcn/ui ToggleGroup component (new)
- `src/components/ui/toggle.tsx` - shadcn/ui Toggle component (new, dependency of ToggleGroup)
- `src/components/ui/switch.tsx` - shadcn/ui Switch component (new)
- `src/components/ui/label.tsx` - shadcn/ui Label component (new)

## Decisions Made
- Used the drizzle-orm third argument callback pattern `(t) => [unique(...).on(t.col1, t.col2)]` for the composite unique constraint, as required by current drizzle-orm API
- Strict zod enum validation for criterion values (outcome_quality, time_saved, repeatability, use_again) prevents invalid criteria at the action layer
- Rating validated as `z.number().int().min(0).max(5)` even though DB column is `real` -- enforces integer star-rating semantics from the UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data layer complete: schema supports upserts, Server Actions handle rating and notes saves, query returns all scorecard data
- UI primitives (ToggleGroup, Switch, Label) installed and ready for composition in Plan 02
- Build passes with zero type errors
- Ready to build the scorecard UI components in 04-02

## Self-Check: PASSED

---
*Phase: 04-weekly-scorecard*
*Completed: 2026-02-07*

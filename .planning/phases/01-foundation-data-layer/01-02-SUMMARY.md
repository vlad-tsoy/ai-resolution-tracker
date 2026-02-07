---
phase: 01-foundation-data-layer
plan: 02
subsystem: database
tags: [drizzle-orm, neon-postgres, seed-data, tsx, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer/01-01
    provides: "Drizzle ORM schema with 4 tables pushed to Neon Postgres"
provides:
  - "Neon Postgres populated with 11 weekends, 80 work items, and 11 done criteria from PDF"
  - "Idempotent seed script for database reset"
  - "Seed verification page showing aggregate counts"
affects: [01-03, 02-weekend-overview, 03-core-interactions, 04-weekly-scorecard]

# Tech tracking
tech-stack:
  added: []
  patterns: [standalone-seed-script, dotenv-env-local, returning-for-ids, identity-sequence-reset]

key-files:
  created:
    - src/db/seed.ts
  modified:
    - src/app/page.tsx

key-decisions:
  - "Used standalone Neon+Drizzle connection in seed script (not importing from lib/db.ts) for Next.js-independent execution"
  - "Reset identity sequences with COALESCE(MAX(id), 1) to handle empty-table edge case"
  - "Stored bonus weekend as number=11 with isBonus=true flag"

patterns-established:
  - "Seed script pattern: dotenv .env.local -> standalone neon client -> clear children first -> insert with .returning() -> reset sequences"
  - "Idempotent seeding: delete all then re-insert (safe to re-run)"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 1 Plan 02: Seed Database Summary

**Idempotent seed script populating Neon Postgres with all 11 weekends (80 work items, 11 done criteria) using exact PDF content from the 10-Week AI Resolution**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-07T07:42:56Z
- **Completed:** 2026-02-07T07:46:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created seed script with verbatim content from all 11 weekends of the "AI New Year's: 10-Week AI Resolution" PDF
- Database populated: 11 weekends, 80 work items (core + advanced), and 11 done-when criteria
- Categories correctly mapped: foundation (1-2), core_projects (3-6), automation (7-8), system_and_build (9-10), bonus (11)
- Identity sequences reset for all 4 tables to prevent future insert conflicts
- Verification page confirms counts match expectations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create seed script with all 11 weekends of PDF content** - `d5c6b0f` (feat)
2. **Task 2: Verify seed data integrity** - `8ef294c` (feat)

## Files Created/Modified
- `src/db/seed.ts` - Complete seed script with all 11 weekends, work items, done criteria, and sequence resets (860 lines)
- `src/app/page.tsx` - Updated to show weekend, work item, and done criteria counts for verification

## Decisions Made
- Used standalone Neon + Drizzle connection in seed.ts (separate from lib/db.ts) so seed runs outside Next.js context via tsx
- Reset identity sequences using `SELECT setval(pg_get_serial_sequence(...), COALESCE(MAX(id), 1))` to handle empty-table edge case
- Stored bonus weekend as number=11 with isBonus=true to differentiate from regular weekends while maintaining sequential ordering

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - database was already configured in Plan 01-01.

## Next Phase Readiness
- Database is fully populated and ready for UI development (Plan 01-03)
- All 11 weekends with work items and done criteria are queryable via Drizzle ORM
- Seed script is idempotent and can be re-run to reset data at any time
- No blockers or concerns

## Self-Check: PASSED

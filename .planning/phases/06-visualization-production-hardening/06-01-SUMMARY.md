---
phase: 06-visualization-production-hardening
plan: 01
subsystem: ui
tags: [recharts, shadcn-chart, bar-chart, drizzle-aggregation, next-dynamic]

# Dependency graph
requires:
  - phase: 04-weekly-scorecard
    provides: scorecardRatings table with criterion/rating data
  - phase: 01-foundation-data-layer
    provides: Drizzle ORM + Neon Postgres schema with weekends table
provides:
  - getScorecardAverages() aggregation query for scorecard data
  - ScoreTrendsChart grouped bar chart component
  - Lazy-loaded chart section on overview page
affects: []

# Tech tracking
tech-stack:
  added: [recharts@2.15.4, shadcn/ui chart component]
  patterns: [Drizzle SQL builder API for aggregation, Client Component wrapper for next/dynamic ssr:false in Server Component pages]

key-files:
  created:
    - src/components/ui/chart.tsx
    - src/components/weekend/score-trends-chart.tsx
    - src/components/weekend/score-trends-section.tsx
  modified:
    - src/lib/queries.ts
    - src/app/(dashboard)/page.tsx
    - package.json

key-decisions:
  - "Client Component wrapper (score-trends-section.tsx) for next/dynamic ssr:false -- Next.js 16 Turbopack disallows ssr:false in Server Components"
  - "Drizzle SQL builder API (db.select().from()) for getScorecardAverages -- relational API does not support avg()/groupBy"
  - "use_again excluded from chart -- binary 0/1 criterion does not belong on 1-5 rating scale"
  - "Promise.all for parallel data fetching -- weekends + scorecard averages fetched concurrently"

patterns-established:
  - "Client Component wrapper pattern: when next/dynamic with ssr:false is needed from a Server Component, create a thin 'use client' wrapper"
  - "SQL builder API pattern: use db.select().from() for aggregation queries alongside relational API for standard queries"

# Metrics
duration: 4min
completed: 2026-02-07
---

# Phase 6 Plan 1: Score Trends Visualization Summary

**Grouped bar chart with recharts/shadcn showing average Outcome Quality, Time Saved, and Repeatability across completed weekends**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-07T21:57:44Z
- **Completed:** 2026-02-07T22:01:20Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Drizzle aggregation query computing per-weekend, per-criterion average ratings from completed weekends
- Grouped bar chart with three color-coded bars per weekend, Y-axis fixed 0-5, tooltips with exact averages, legend
- Chart conditionally hidden when no scored weekends exist
- Lazy-loaded via Client Component wrapper with skeleton loading state for zero initial bundle impact

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn/ui chart and add aggregation query** - `3375049` (feat)
2. **Task 2: Build score trends chart and integrate into overview** - `b19ce6f` (feat)

## Files Created/Modified
- `src/components/ui/chart.tsx` - shadcn/ui chart utilities (ChartContainer, ChartConfig, ChartTooltip, ChartLegend)
- `src/components/weekend/score-trends-chart.tsx` - Client Component grouped bar chart with recharts
- `src/components/weekend/score-trends-section.tsx` - Client Component wrapper for next/dynamic ssr:false
- `src/lib/queries.ts` - Added getScorecardAverages() aggregation query
- `src/app/(dashboard)/page.tsx` - Lazy-loaded chart section with conditional rendering
- `package.json` - Added recharts dependency

## Decisions Made
- **Client Component wrapper for dynamic import:** Next.js 16 with Turbopack does not allow `next/dynamic` with `ssr: false` in Server Components. Created `score-trends-section.tsx` as a thin "use client" wrapper that performs the dynamic import, then imported that wrapper from the Server Component page. This preserves code-splitting while complying with the framework constraint.
- **SQL builder API for aggregation:** Used `db.select().from()` with `.groupBy()` and `sql<number>\`avg(...)\`` because Drizzle's relational query API does not support aggregate functions.
- **Exclude use_again:** The `use_again` criterion is binary (0/1) and does not belong on the same 1-5 rating scale chart as the other three criteria.
- **Promise.all for data fetching:** Fetch weekends and scorecard averages in parallel for better page load performance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 Turbopack disallows ssr:false in Server Components**
- **Found during:** Task 2 (overview page integration)
- **Issue:** `next/dynamic` with `ssr: false` cannot be used directly in a Server Component page -- Turbopack build fails with "ssr: false is not allowed with next/dynamic in Server Components"
- **Fix:** Created `score-trends-section.tsx` as a thin Client Component wrapper that handles the dynamic import with `ssr: false`, then imported the wrapper from the Server Component page
- **Files modified:** src/components/weekend/score-trends-section.tsx (created), src/app/(dashboard)/page.tsx (adjusted imports)
- **Verification:** `npm run build` succeeds
- **Committed in:** b19ce6f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary workaround for Next.js 16 Server Component constraint. No scope creep. Chart is still lazy-loaded and code-split as intended.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Score trends visualization complete and functional
- Chart auto-updates on page load via force-dynamic + server query
- Ready for remaining Phase 6 plans (production hardening, deployment)

## Self-Check: PASSED

---
*Phase: 06-visualization-production-hardening*
*Completed: 2026-02-07*

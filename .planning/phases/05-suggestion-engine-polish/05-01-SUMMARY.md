---
phase: 05-suggestion-engine-polish
plan: 01
subsystem: ui
tags: [suggestion-engine, pure-function, server-component, lucide-react, shadcn-card]

# Dependency graph
requires:
  - phase: 02-weekend-overview
    provides: WeekendWithWorkItems type and deriveStatus logic
provides:
  - getSuggestedWeekend pure function for weekend recommendation
  - SuggestedWeekendBanner component for overview page
affects: [05-suggestion-engine-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function suggestion engine operating on fetched data (no DB calls)"
    - "Conditional banner rendering between progress bar and grid"

key-files:
  created:
    - src/lib/suggestions.ts
    - src/components/weekend/suggested-weekend-banner.tsx
  modified:
    - src/app/(dashboard)/page.tsx

key-decisions:
  - "getSuggestedWeekend returns WeekendWithWorkItems (full type) not a minimal shape -- simpler integration"
  - "Banner is a Server Component (no use client) since it only renders static markup with Link"
  - "Category dependency order constant defined in suggestions.ts, not shared with weekend-grid.tsx"

patterns-established:
  - "Pure function recommendation: derive suggestion from already-fetched data, no separate DB call"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 5 Plan 1: Suggestion Engine & Banner Summary

**Pure function getSuggestedWeekend with category-aware priority logic and "Up Next" banner on overview page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T21:13:08Z
- **Completed:** 2026-02-07T21:15:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- getSuggestedWeekend pure function with in-progress priority and category dependency order fallback
- SuggestedWeekendBanner component with Sparkles icon, primary tint, and link to suggested weekend
- Banner integrated between ProgressOverview and WeekendGrid on overview page, conditionally rendered

## Task Commits

Each task was committed atomically:

1. **Task 1: Create suggestion engine pure function** - `14282f1` (feat)
2. **Task 2: Create suggestion banner and integrate into overview page** - `86530e5` (feat)

## Files Created/Modified
- `src/lib/suggestions.ts` - Pure function getSuggestedWeekend with category-aware priority algorithm
- `src/components/weekend/suggested-weekend-banner.tsx` - Server Component banner with Sparkles icon and ArrowRight
- `src/app/(dashboard)/page.tsx` - Imports and renders suggestion banner between progress bar and grid

## Decisions Made
- getSuggestedWeekend returns the full `WeekendWithWorkItems` type rather than a minimal shape, allowing the page to access any field without additional mapping
- Banner is a Server Component (no `"use client"`) since it only renders static markup with a Next.js Link -- no interactivity needed
- CATEGORY_ORDER constant defined locally in suggestions.ts rather than shared with weekend-grid.tsx to keep modules independent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Suggestion engine ready for animation plans (05-02, 05-03)
- Banner can be enhanced with Motion enter animation in future plan
- All weekend cards remain clickable regardless of suggestion

## Self-Check: PASSED

---
*Phase: 05-suggestion-engine-polish*
*Completed: 2026-02-07*

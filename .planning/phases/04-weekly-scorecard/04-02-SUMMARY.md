---
phase: 04-weekly-scorecard
plan: 02
subsystem: ui
tags: [react, shadcn-ui, toggle-group, switch, optimistic-ui, debounce, markdown, scorecard]

# Dependency graph
requires:
  - phase: 04-weekly-scorecard
    provides: "saveRating upsert, saveScorecardNotes Server Actions, getWeekendById with scorecardRatings, ToggleGroup/Switch/Label UI primitives"
  - phase: 03-core-interactions
    provides: "NotesEditor pattern (debounced auto-save textarea with markdown preview), useOptimistic/useTransition patterns"
provides:
  - "RatingScale component: 1-5 ToggleGroup with optimistic UI and auto-save"
  - "UseAgainToggle component: Yes/No Switch with optimistic UI and auto-save"
  - "ScorecardNotesEditor component: debounced auto-saving textarea with markdown preview"
  - "ScorecardSection container composing all four rating dimensions plus notes"
  - "WeekendDetail conditional scorecard rendering with locked state for uncompleted weekends"
affects: [05-progress-dashboard, 06-polish-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Completion-gated UI sections (opacity-50 + Lock icon for locked state)", "Reusable rating component pattern with criterion prop for multiple dimensions"]

key-files:
  created:
    - src/components/weekend/rating-scale.tsx
    - src/components/weekend/use-again-toggle.tsx
    - src/components/weekend/scorecard-notes-editor.tsx
    - src/components/weekend/scorecard-section.tsx
  modified:
    - src/components/weekend/weekend-detail.tsx

key-decisions:
  - "Math.round() on rating values from DB to handle real column returning floats like 3.0"
  - "ScorecardNotesEditor follows exact same pattern as NotesEditor with 4 rows instead of 6"
  - "Locked state uses opacity-50 + Lock icon + explanatory text rather than hidden section"

patterns-established:
  - "Completion-gated sections: conditional render on completedAt with locked fallback"
  - "Rating dimension pattern: single RatingScale component reused for multiple criteria via props"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 4 Plan 2: Scorecard UI Composition Summary

**RatingScale (1-5 ToggleGroup), UseAgainToggle (Switch), ScorecardNotesEditor (debounced textarea), ScorecardSection container, and completion-gated integration into WeekendDetail**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T19:44:53Z
- **Completed:** 2026-02-07T19:46:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created RatingScale component with 1-5 ToggleGroup, optimistic UI via useOptimistic, and deselection guard
- Created UseAgainToggle component with Switch for Yes/No, optimistic UI, and text indicator
- Created ScorecardNotesEditor following exact NotesEditor pattern with debounced auto-save and markdown preview
- Created ScorecardSection container composing all four rating dimensions plus scorecard notes
- Integrated scorecard into WeekendDetail with completion gating: active for completed weekends, locked (opacity-50 + Lock icon) for uncompleted ones

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scorecard rating and toggle components** - `f9bbd55` (feat)
2. **Task 2: Create ScorecardSection container and integrate into WeekendDetail** - `6d3d828` (feat)

## Files Created/Modified
- `src/components/weekend/rating-scale.tsx` - 1-5 scale rating via ToggleGroup with optimistic UI and auto-save (new)
- `src/components/weekend/use-again-toggle.tsx` - Yes/No toggle via Switch with optimistic UI and auto-save (new)
- `src/components/weekend/scorecard-notes-editor.tsx` - Debounced auto-saving textarea with markdown preview for scorecard notes (new)
- `src/components/weekend/scorecard-section.tsx` - Container composing all four rating dimensions plus notes editor (new)
- `src/components/weekend/weekend-detail.tsx` - Added conditional scorecard rendering based on completedAt, Lock icon import

## Decisions Made
- Used Math.round() when reading rating values from the ratingMap to handle the real DB column potentially returning float values like 3.0
- ScorecardNotesEditor follows the exact same pattern as the existing NotesEditor (debounce, save status, markdown preview) but with 4 rows instead of 6 and scorecard-specific placeholder text
- Locked state renders as a visible but faded section (opacity-50) with Lock icon and explanatory text, rather than hiding the scorecard entirely -- this communicates the feature exists and how to unlock it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 4 (Weekly Scorecard) is now complete: data layer (Plan 01) and UI composition (Plan 02) both done
- All four Phase 4 success criteria met: ratings display, auto-save, notes persistence, locked state
- End-to-end flow wired: query -> page -> detail -> scorecard -> rating components -> Server Actions -> database
- Ready to proceed to Phase 5 (Progress Dashboard)

## Self-Check: PASSED

---
*Phase: 04-weekly-scorecard*
*Completed: 2026-02-07*

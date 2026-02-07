---
phase: 03-core-interactions
plan: 01
subsystem: api
tags: [server-actions, drizzle, zod, react-markdown, debounce, shadcn-ui]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    provides: "Database schema (workItems, weekends tables), Drizzle ORM setup, zod"
  - phase: 02-weekend-overview
    provides: "Detail page route, query layer (getWeekendById)"
provides:
  - "toggleWorkItem Server Action with atomic toggle and weekend completion derivation"
  - "saveNotes Server Action with zod validation"
  - "useDebouncedCallback hook for auto-save"
  - "shadcn/ui Checkbox and Textarea components"
  - "react-markdown package for notes rendering"
affects: [03-02, 03-03, 04-progress-tracking]

# Tech tracking
tech-stack:
  added: [react-markdown@10.1.0, @radix-ui/react-checkbox]
  patterns: ["Server Actions with 'use server' directive", "Atomic boolean toggle with Drizzle not()", "Derived state (weekend completion from core items)", "Zod validation on Server Action inputs", "Debounced callback with callbackRef pattern"]

key-files:
  created:
    - src/lib/actions.ts
    - src/lib/hooks/use-debounce.ts
    - src/components/ui/checkbox.tsx
    - src/components/ui/textarea.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used react-markdown v10 (latest) instead of v9 -- v10 was available and React 19 compatible"
  - "Custom 35-line debounce hook instead of use-debounce package -- avoids dependency for single use case"
  - "Zod v4 for Server Action input validation -- already installed as project dependency"

patterns-established:
  - "Server Actions: 'use server' directive at file top, zod validation, revalidatePath after mutation"
  - "Atomic toggle: Drizzle not() operator for single-SQL boolean flip (no read-then-write)"
  - "Derived completion: Weekend completedAt set/cleared based on core work item state after each toggle"
  - "Debounce hook: callbackRef pattern to avoid stale closures, cleanup on unmount"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 3 Plan 1: Server Actions and Utilities Summary

**toggleWorkItem and saveNotes Server Actions with atomic Drizzle toggle, zod validation, weekend completion derivation, and custom debounce hook**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T19:21:22Z
- **Completed:** 2026-02-07T19:23:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed react-markdown v10 and shadcn/ui Checkbox + Textarea components
- Created toggleWorkItem Server Action with atomic boolean toggle via Drizzle `not()`, automatic weekend completion derivation from core items, and dual-path revalidation
- Created saveNotes Server Action with zod schema validation (positive int weekendId, max 50000 char notes)
- Created useDebouncedCallback hook with callbackRef pattern for stable references and cleanup on unmount

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and add shadcn/ui components** - `5fb4943` (chore)
2. **Task 2: Create Server Actions and debounce hook** - `1dd68d4` (feat)

## Files Created/Modified
- `src/lib/actions.ts` - Server Actions: toggleWorkItem (atomic toggle + completion derivation) and saveNotes (validated persist)
- `src/lib/hooks/use-debounce.ts` - Custom debounce hook with callbackRef and unmount cleanup
- `src/components/ui/checkbox.tsx` - shadcn/ui Checkbox (Radix primitive)
- `src/components/ui/textarea.tsx` - shadcn/ui Textarea
- `package.json` - Added react-markdown, @radix-ui/react-checkbox dependencies
- `package-lock.json` - Lockfile updated

## Decisions Made
- Used react-markdown v10.1.0 (latest available) instead of v9 mentioned in research -- v10 was the current version and fully React 19 compatible
- Custom 35-line debounce hook avoids adding `use-debounce` package dependency for a single use case
- Zod v4 (already a project dependency) for Server Action input validation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Server Actions ready for Client Components in 03-02 (WorkItemRow with useOptimistic, NotesEditor with debounced save)
- Checkbox and Textarea components available for interactive UI
- react-markdown available for notes preview rendering
- No blockers for 03-02 or 03-03

## Self-Check: PASSED

---
*Phase: 03-core-interactions*
*Completed: 2026-02-07*

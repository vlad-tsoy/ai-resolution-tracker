# Roadmap: AI Resolution Tracker

## Overview

This roadmap delivers a personal 10-weekend AI Resolution tracker from empty repo to production Vercel deployment. The journey follows a strict dependency chain: database and design system first (everything depends on persisted data), read path second (display before interaction), write path third (the core CRUD loop), scorecard fourth (unique UI patterns that should not block basic tracking), suggestion engine and animations fifth (require completion data), and visualization plus production hardening last (require scored weekends and all features working). Six phases, each delivering a coherent, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Layer** - Project scaffolding, Neon Postgres schema, seed data, design system, initial Vercel deploy
- [ ] **Phase 2: Weekend Overview** - Read path displaying all weekends, detail views, progress bar, category grouping, responsive layout
- [ ] **Phase 3: Core Interactions** - Write path with completion checkboxes, auto-saving notes, and weekend completion logic
- [ ] **Phase 4: Weekly Scorecard** - Rating system with mixed input types for evaluating completed weekends
- [ ] **Phase 5: Suggestion Engine & Polish** - Next-weekend recommendation algorithm, animations, and completion celebration
- [ ] **Phase 6: Visualization & Production Hardening** - Scorecard charts, error handling, performance optimization, production readiness

## Phase Details

### Phase 1: Foundation & Data Layer
**Goal**: A deployed Next.js app with a populated Neon Postgres database, established design system, and server-first architecture pattern ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, UI-01, UI-06, DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. Visiting the Vercel URL loads a Next.js page without errors
  2. The database contains all 10 weekends plus the bonus weekend with their full content (name, deliverable, core work items, advanced modifiers, "why it matters", "done when" criteria, category)
  3. The app uses Apple-inspired design tokens (clean typography, neutral palette, generous whitespace) visible on the landing page
  4. Data persists in Neon Postgres and is accessible from any device via the deployed URL
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffolding, Drizzle + Neon setup, database schema, push to Neon
- [ ] 01-02-PLAN.md -- Seed script with all 11 weekends of actual PDF content
- [ ] 01-03-PLAN.md -- Apple-inspired design system, landing page, Vercel deployment

### Phase 2: Weekend Overview
**Goal**: Users can browse all 10 weekends, see their current progress, and drill into full weekend details -- the complete read path
**Depends on**: Phase 1
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, DETAIL-01, DETAIL-04, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. The overview page displays all 10 weekends grouped by category (Foundation, Core Projects, Automation, System & Build) with the bonus weekend shown separately
  2. Each weekend shows its name, deliverable one-liner, and visual completion status (completed, in-progress, not-started)
  3. An overall progress bar shows the completion percentage across all 10 weekends
  4. Clicking a weekend opens a detail view showing full info: deliverable, core work items, advanced modifiers (marked as optional), "why it matters", and "done when" criteria
  5. The layout works well on both mobile and desktop, with skeleton loading states during data fetches
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Query layer, overview page with category-grouped grid, progress bar, weekend cards, skeleton loading
- [ ] 02-02-PLAN.md -- Weekend detail page with full info display, back navigation, 404 handling, skeleton loading

### Phase 3: Core Interactions
**Goal**: Users can track their progress by checking off work items and capturing reflections -- the core CRUD loop that makes the app useful
**Depends on**: Phase 2
**Requirements**: DETAIL-02, DETAIL-03, NOTES-01, NOTES-02, NOTES-03
**Success Criteria** (what must be TRUE):
  1. Each weekend's detail view has checkboxes for individual core work items, and checking them persists across page reloads and devices
  2. A weekend is automatically marked complete when all its core work items are checked
  3. Each weekend has a free-text notes field that auto-saves without an explicit save button
  4. Notes support basic formatting (markdown or rich text) and persist across sessions
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Weekly Scorecard
**Goal**: Users can rate completed weekends on four dimensions to build a personal evaluation record
**Depends on**: Phase 3
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05
**Success Criteria** (what must be TRUE):
  1. Completed weekends show a scorecard with ratings for Outcome Quality (1-5), Time Saved (1-5), Repeatability (1-5), and Use Again (Yes/No)
  2. Scorecard ratings auto-save on change without requiring an explicit save action
  3. Each scorecard includes a free-text field for notes (best prompt, approach, what didn't work) that persists
  4. Uncompleted weekends do not show the scorecard (or show it as locked/disabled)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Suggestion Engine & Polish
**Goal**: Users get intelligent next-weekend recommendations and the app feels polished with purposeful animations
**Depends on**: Phase 3 (needs completion data)
**Requirements**: SUGGEST-01, SUGGEST-02, SUGGEST-03, SUGGEST-04, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. The overview page prominently displays a recommendation for which weekend to tackle next, based on completion state and category dependency order
  2. The suggestion respects soft dependencies (Foundation before Core Projects before Automation before System & Build) and prefers in-progress weekends over not-started ones
  3. Users can ignore the suggestion and pick any weekend freely
  4. Marking a weekend complete triggers a visible celebration animation
  5. The app has smooth animations on progress bar changes, page transitions, and state changes
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Visualization & Production Hardening
**Goal**: Users can see score trends across completed weekends, and the app is production-ready with proper error handling and performance
**Depends on**: Phase 4 (needs scorecard data), Phase 5
**Requirements**: VIZ-01, VIZ-02, VIZ-03, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. A visual summary (chart or graph) shows scores across all completed weekends, with averages displayed per rating dimension
  2. The visualization updates automatically as more weekends are completed and scored
  3. The app has no console errors in production, with proper error handling for database connectivity issues
  4. Initial page load is under 3 seconds on a standard connection
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 0/3 | Not started | - |
| 2. Weekend Overview | 0/2 | Not started | - |
| 3. Core Interactions | 0/3 | Not started | - |
| 4. Weekly Scorecard | 0/2 | Not started | - |
| 5. Suggestion Engine & Polish | 0/3 | Not started | - |
| 6. Visualization & Production Hardening | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-07*

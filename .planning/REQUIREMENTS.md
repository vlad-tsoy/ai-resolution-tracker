# Requirements: AI Resolution Tracker

**Defined:** 2026-02-07
**Core Value:** A single place to see where I am in the 10-weekend program and what to do next -- simple enough that I actually use it.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data & Persistence

- [ ] **DATA-01**: All weekend data (completion state, notes, scores) persisted in Neon Postgres cloud database
- [ ] **DATA-02**: Data accessible from any device via the same URL
- [ ] **DATA-03**: Weekend seed data includes all 10 weekends plus bonus weekend from the PDF (name, deliverable, core work items, advanced modifiers, "why it matters", "done when" criteria, category)

### Weekend List & Overview

- [ ] **LIST-01**: Display all 10 weekends in a list/grid with name, deliverable one-liner, and completion status
- [ ] **LIST-02**: Group weekends by category (Foundation, Core Projects, Automation, System & Build)
- [ ] **LIST-03**: Overall progress bar showing completion percentage across all 10 weekends
- [ ] **LIST-04**: Visual distinction between completed, in-progress, and not-started weekends
- [ ] **LIST-05**: Bonus weekend displayed separately from the main 10

### Weekend Detail View

- [ ] **DETAIL-01**: Expanded view showing full weekend info: deliverable, core work items, advanced modifiers, "why it matters", "done when" criteria
- [ ] **DETAIL-02**: Completion checkboxes for individual core work items within each weekend
- [ ] **DETAIL-03**: Weekend marked complete when all core work items are checked
- [ ] **DETAIL-04**: Advanced modifiers shown as optional extras (not required for completion)

### Notes

- [ ] **NOTES-01**: Free-text notes field per weekend for capturing reflections, links, and learnings
- [ ] **NOTES-02**: Notes auto-save (no explicit save button needed)
- [ ] **NOTES-03**: Notes support basic formatting (markdown or rich text)

### Weekly Scorecard

- [ ] **SCORE-01**: Rate each completed weekend on Outcome Quality (1-5 scale)
- [ ] **SCORE-02**: Rate each completed weekend on Time Saved (1-5 scale)
- [ ] **SCORE-03**: Rate each completed weekend on Repeatability (1-5 scale)
- [ ] **SCORE-04**: Rate each completed weekend on Use Again (Yes/No)
- [ ] **SCORE-05**: Free-text field for scorecard notes (best prompt, approach, what didn't work)

### Scorecard Visualization

- [ ] **VIZ-01**: Visual summary of scores across completed weekends (chart or graph)
- [ ] **VIZ-02**: Average scores displayed for each rating dimension
- [ ] **VIZ-03**: Visualization updates as more weekends are completed

### Suggest Next Weekend

- [ ] **SUGGEST-01**: Recommend which weekend to tackle next based on completion state
- [ ] **SUGGEST-02**: Respect soft dependency order (Foundation before Core Projects before Automation before System & Build)
- [ ] **SUGGEST-03**: Display recommendation prominently on the overview page
- [ ] **SUGGEST-04**: Allow user to ignore suggestion and pick any weekend

### Design & Polish

- [ ] **UI-01**: Apple-inspired minimalist design -- clean typography, generous whitespace, neutral palette
- [ ] **UI-02**: Subtle animations and transitions using Motion library
- [ ] **UI-03**: Completion celebration visual when marking a weekend complete
- [ ] **UI-04**: Responsive design -- works well on mobile and desktop
- [ ] **UI-05**: Loading states with skeleton UI during data fetches
- [ ] **UI-06**: Use frontend-design skill for high-quality UI implementation

### Deployment

- [ ] **DEPLOY-01**: Deployed live on Vercel
- [ ] **DEPLOY-02**: Production-ready (no console errors, proper error handling)
- [ ] **DEPLOY-03**: Reasonable page load performance (< 3s initial load)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-01**: User accounts for multi-user support
- **AUTH-02**: OAuth login (Google, GitHub)

### PWA

- **PWA-01**: Installable as PWA on mobile
- **PWA-02**: Offline support with sync

### Advanced Features

- **ADV-01**: Time tracking per weekend
- **ADV-02**: Export progress data (JSON, CSV)
- **ADV-03**: Streak tracking / consistency metrics
- **ADV-04**: Custom weekend items (add your own projects)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication | Personal single-user tool, no auth needed for v1 |
| Gamification / badges | Adds complexity without value for personal use |
| Push notifications | Overkill for a personal tracker |
| Social features / sharing | Personal tool, not social |
| AI-powered insights | Over-engineering for 10 data points |
| Real-time collaboration | Single user |
| Mobile native app | Responsive web is sufficient |
| Complex analytics dashboard | Scorecard visualization covers this adequately |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| LIST-01 | Phase 2 | Complete |
| LIST-02 | Phase 2 | Complete |
| LIST-03 | Phase 2 | Complete |
| LIST-04 | Phase 2 | Complete |
| LIST-05 | Phase 2 | Complete |
| DETAIL-01 | Phase 2 | Complete |
| DETAIL-02 | Phase 3 | Complete |
| DETAIL-03 | Phase 3 | Complete |
| DETAIL-04 | Phase 2 | Complete |
| NOTES-01 | Phase 3 | Complete |
| NOTES-02 | Phase 3 | Complete |
| NOTES-03 | Phase 3 | Complete |
| SCORE-01 | Phase 4 | Pending |
| SCORE-02 | Phase 4 | Pending |
| SCORE-03 | Phase 4 | Pending |
| SCORE-04 | Phase 4 | Pending |
| SCORE-05 | Phase 4 | Pending |
| VIZ-01 | Phase 6 | Pending |
| VIZ-02 | Phase 6 | Pending |
| VIZ-03 | Phase 6 | Pending |
| SUGGEST-01 | Phase 5 | Pending |
| SUGGEST-02 | Phase 5 | Pending |
| SUGGEST-03 | Phase 5 | Pending |
| SUGGEST-04 | Phase 5 | Pending |
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |
| UI-04 | Phase 2 | Complete |
| UI-05 | Phase 2 | Complete |
| UI-06 | Phase 1 | Complete |
| DEPLOY-01 | Phase 1 | Complete |
| DEPLOY-02 | Phase 6 | Pending |
| DEPLOY-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after Phase 3 completion*

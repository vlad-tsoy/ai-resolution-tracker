# Feature Research

**Domain:** Personal progress tracker / fixed-program completion tracker (10-Weekend AI Resolution)
**Researched:** 2026-02-07
**Confidence:** HIGH -- this is a well-understood domain with clear patterns from habit trackers, course trackers, and checklist apps. The project's fixed scope (10 weekends, known structure) makes feature decisions more constrained and confident than an open-ended habit tracker.

## Context: This Is NOT a Generic Habit Tracker

Critical distinction before listing features: this app tracks progress through a **fixed, finite program** (10 weekends with predefined content), not open-ended daily habits. This fundamentally changes what matters:

- No habit creation/customization needed -- the 10 weekends are predefined
- No recurring schedules or daily check-ins -- weekends are completed once
- No streak mechanics -- completion is binary per weekend, not daily
- The data model is a known, static structure enriched with user input (notes, scores, completion)

The closest analogues are **course completion trackers** (Udemy progress bars, Moodle checklists) and **project milestone trackers**, not Todoist or Habitica.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the user assumes exist. Missing these = the app feels broken or pointless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Weekend list view** -- all 10 weekends displayed with project name, deliverable summary | Core purpose of the app. The PDF's "One-Page Completion Checklist" (page 15) is literally this. Without it, there is no app. | LOW | Static data rendered from a config/data file. Consider grouping by category as the PDF does: Foundation, Core Projects, Automation, System & Build. |
| **Completion checkboxes** -- mark each weekend as done/not-done | The most fundamental tracking interaction. The PDF checklist is checkboxes. Every course tracker and habit tracker has this as the primary input. | LOW | Binary toggle per weekend. Persist immediately on click. No confirmation dialogs -- one-tap completion per anti-pattern research. |
| **Overall progress bar** -- visual indicator of X/10 (or X/11 with bonus) completed | Users expect visual progress feedback. UX research (UserGuiding, UXPin, Smashing Magazine) unanimously identifies progress bars as reducing abandonment via the Zeigarnik effect -- incomplete tasks nag you to finish. Without this, the tracker is just a list. | LOW | Simple fraction: completed count / total count. Percentage display. Consider showing both "4/10 weekends" and "40%" for dual-approach clarity (Userpilot pattern). |
| **Weekend detail view** -- expandable/clickable view showing full info per weekend (deliverable, the work, advanced modifiers, why it matters, done when) | The PDF has rich content per weekend. Users need to reference this while working. Without detail, the tracker adds no value over a plain checklist. | LOW-MEDIUM | Pull structured data from the PDF. Each weekend has: deliverable, core work steps, advanced modifiers, why it matters/why this goes first, and "done when" criteria. |
| **Notes field per weekend** -- free-text area to capture reflections, links, learnings | The PDF's scorecard section says "Notes: best prompt, approach, what didn't work." Users need to capture context while it is fresh. This is how the tracker becomes more useful than a printout. | LOW | Textarea with auto-save. No character limits. Markdown support is a nice-to-have but not table stakes. |
| **Weekly scorecard ratings** -- rate each weekend on the 4 criteria from the PDF | Explicitly defined in the program's structure (page 2 of PDF). The four axes are: Outcome Quality (1-5), Time Saved (1-5), Repeatability ("Could I do this again?"), Use Again (Yes/No). This is the reflection mechanism. | MEDIUM | Mixed input types: two 1-5 scales, one qualitative "could I do this again?" field, one Yes/No toggle. Need to design a clean UI for this that does not feel like a form. Consider star ratings or slider for the 1-5 scales. |
| **Data persistence across devices** -- data saved to cloud, accessible from any browser | Explicitly required in PROJECT.md. Without this, data loss on browser clear would destroy trust. The core value statement says "simple enough that I actually use it" -- losing data kills that. | MEDIUM | Requires a cloud database (Supabase/PlanetScale per constraints). No auth means either a unique URL token, device fingerprint, or simple passphrase. This is the most complex table-stakes item. |
| **Responsive design** -- works on phone, tablet, desktop | Users will check this from multiple devices. A web app that breaks on mobile in 2026 is unacceptable. Not a native app, but must be usable on phone. | MEDIUM | Mobile-first responsive design. The weekend list view especially needs to work on narrow screens. |
| **Deployed and live on Vercel** -- accessible via URL, not localhost | Explicitly required. The "done when" for Weekend 1 is "Your tracker is live on the internet." | LOW | Standard Next.js + Vercel deployment. Essentially zero config. |

### Differentiators (Competitive Advantage / Delight)

Features that go beyond expectations and make this tracker genuinely delightful. Not required for MVP, but several of these are explicitly in the project requirements.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Suggest next weekend" logic** -- recommend which weekend to tackle next based on completion state | Explicitly requested in PROJECT.md and listed as an "Advanced" feature in the PDF's Weekend 1 definition. This is the single biggest differentiator over a static checklist. Makes the tracker feel intelligent and opinionated. | MEDIUM | Logic based on: (1) prerequisite dependencies (e.g., Weekend 1 before everything else, Weekend 7 before 8), (2) category balance (Foundation before Core Projects before Automation), (3) which weekends are incomplete. The PDF says the program is "modular -- skip or reorder without derailing everything" but also "compounding -- later weekends reuse earlier builds." The suggestion should respect both. |
| **Category grouping** -- weekends organized by theme (Foundation, Core Projects, Automation, System & Build) | The PDF's completion checklist (page 15) groups weekends this way. Grouping provides visual hierarchy and helps the user understand the program's arc. More meaningful than a flat numbered list. | LOW | Static grouping matching the PDF: Foundation (Day 0 + Weekends 1-2), Core Projects (3-6), Automation (7-8), System & Build (9-10), Bonus. |
| **Apple-inspired minimalist design** -- clean typography, generous whitespace, subtle animations | Explicitly required in PROJECT.md. This is the aesthetic DNA of the app. Done well, it makes a simple tool feel premium. Most personal trackers look utilitarian; this one should feel like an Apple product page. | MEDIUM-HIGH | Requires careful design attention: SF Pro or Inter font, muted color palette, large touch targets, smooth transitions, no visual clutter. The design IS the differentiator for a tool this simple. Completion animations (confetti-free -- think a subtle checkmark morph) add delight. |
| **Scorecard visualization over time** -- see your ratings across all completed weekends in a summary view | The scorecard data becomes valuable in aggregate. "Am I getting better at building repeatable workflows?" can only be answered by seeing trends across weekends 1 through 10. Spider charts or simple bar comparisons. | MEDIUM | Requires scorecard data from multiple weekends. Consider a summary dashboard showing average scores, which weekends had highest/lowest ratings, and whether scores trend upward. |
| **"Done when" criteria display** -- show the specific completion criterion prominently for each weekend | Each weekend in the PDF has a specific "DONE WHEN" statement (e.g., "Your tracker is live on the internet, you've logged Weekend 1, and you trust you'll actually use it"). Displaying this prominently makes the checkbox feel earned, not arbitrary. | LOW | Static data from the PDF, displayed in a visually distinct callout. Acts as both motivation and quality gate. |
| **Bonus Weekend support** -- include "The Agent Exploration" as an optional 11th item | The PDF has a bonus weekend with its own deliverable (Agent Scorecard + Use Cases). Including it makes the tracker comprehensive. Marking it visually distinct (optional/bonus) prevents it from making 10/10 feel incomplete. | LOW | Same data structure as other weekends but flagged as "bonus." Exclude from main progress bar denominator (show "10/10 + bonus" rather than "10/11"). |
| **Completion celebration** -- visual feedback when all 10 weekends are done | Course completion trackers universally celebrate the finish. The Zeigarnik effect that drives progress also demands a satisfying resolution. A subtle celebration (not gamification -- more like a quiet "mission accomplished" moment) when hitting 10/10 aligns with Apple aesthetic. | LOW | Triggered when all 10 core weekends are complete. Subtle animation or state change on the progress bar. The PDF's final page says "The Future is Yours" -- this is the moment for that. |
| **Quick-entry mode for scorecard** -- rate a weekend in under 30 seconds | Anti-pattern research is emphatic: friction in daily check-ins kills apps. The scorecard has only 4 fields (two 1-5 scales, one text, one yes/no). If filling it out takes more than 30 seconds, users will skip it. | LOW-MEDIUM | Inline rating UI rather than a separate form/page. Tap stars, toggle yes/no, done. No "submit" button -- auto-save on each change. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build. Each one seems reasonable in isolation but would hurt this specific product.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User authentication / multi-user** | "What if someone else wants to use it?" | Explicitly out of scope per PROJECT.md. Auth adds enormous complexity (OAuth, sessions, user management) for a single-user personal tool. It changes the data model, adds security requirements, and delays shipping by days. The PDF lists this as an "Advanced" modifier for Weekend 1, meaning it is deliberately beyond core scope. | Use a unique URL with a simple token or passphrase for light access control. Or no protection at all -- it is personal data on a personal URL. |
| **Gamification (XP, levels, badges, avatars)** | Habitica popularized this. "Makes tracking fun!" | Research is clear: gamification adds complexity without supporting the actual goal for a focused, finite program. You are completing 10 weekends, not building a character. Gamification works for open-ended daily habits where motivation flags; for a finite program, the progress bar IS the game. Adding RPG mechanics would also violate the Apple-minimalist aesthetic. | The progress bar (4/10, 40%) and completion celebrations provide sufficient motivation feedback. The scorecard ratings provide the reflection loop. |
| **Streak tracking / daily check-ins** | "Maintain momentum with streaks!" | This is not a daily habit. Weekends are completed once, possibly weeks apart. Streak mechanics create toxic pressure (the "what the hell" effect from anti-pattern research) and make no sense for a program where "do Weekend 3 this Saturday" is the grain, not "check in daily." | Show "last completed" date per weekend and overall program velocity (weekends per month) if any temporal motivation is desired. |
| **Reminders / push notifications** | "Remind me to work on the next weekend!" | For a personal single-user tool, reminders add infrastructure complexity (service workers, notification permissions, email integration) and create the "habit dependency" anti-pattern -- the user should want to open the tracker, not be nagged by it. The app should be pull-based, not push-based. | The "suggest next weekend" feature serves as a gentle pull when the user voluntarily opens the app. |
| **Social features / sharing / leaderboards** | "Share progress with friends!" | Explicitly out of scope per PROJECT.md. Social features require auth, user profiles, privacy controls, and content moderation. They also shift the motivation from intrinsic ("I'm building AI fluency") to extrinsic ("look what I did"), which research shows is less durable. | If sharing is ever wanted, a simple "export as image" of the progress state would suffice without any backend social infrastructure. |
| **Time tracking per weekend** | "Track how long each weekend takes!" | Explicitly deferred in PROJECT.md ("not needed for v1"). Time tracking adds UI complexity (start/stop timers, manual entry, editing), data model complexity, and does not support the core value of "see where I am and what to do next." The PDF says each weekend is "2-4 hrs core work" -- that is sufficient guidance. | If desired later, a simple "hours spent" numeric input per weekend is far simpler than a timer system. |
| **Custom habits / tasks beyond the 10 weekends** | "Let me add my own items!" | Transforms the app from a focused program tracker into a generic todo app. The fixed 10-weekend structure is the product's strength -- it is opinionated and complete. Adding custom items opens the door to scope creep, cluttered UI, and the "too many habits" anti-pattern. | The notes field per weekend can capture any additional context. If the user wants a generic tracker, Todoist exists. |
| **PWA / offline support** | "Use it on the subway!" | Explicitly deferred in PROJECT.md. PWA adds service worker complexity, cache invalidation challenges, and offline/online sync conflicts. For a tool checked weekly (not daily), connectivity is rarely an issue. | Responsive web design ensures it works on mobile browsers when online. Revisit PWA only if actual offline usage patterns emerge. |
| **Complex analytics / dashboards** | "Show me charts and trends!" | Anti-pattern research warns that excessive measurement becomes procrastination. For 10 data points (one per weekend), complex analytics are absurd -- you can see the whole picture at a glance. Building chart libraries and data viz for 10 items is overengineering. | The scorecard summary view (showing ratings across completed weekends) provides sufficient analytical value. A simple table or small multiples, not D3 charts. |
| **AI-powered insights / coaching** | "Use AI to analyze my progress!" | Ironic for an AI fluency program, but: AI features add API costs, latency, prompt engineering complexity, and failure modes for a tool that should be instant and reliable. The program itself IS the AI coaching. The tracker just tracks. | The "suggest next weekend" logic provides the only intelligent recommendation needed, and it is rule-based, not AI-powered. |

---

## Feature Dependencies

```
[Cloud Persistence (DB setup)]
    |
    +---> [Weekend List View] ---> [Completion Checkboxes]
    |         |                         |
    |         |                         +---> [Overall Progress Bar]
    |         |                         |
    |         |                         +---> [Completion Celebration] (triggers at 10/10)
    |         |
    |         +---> [Weekend Detail View]
    |                    |
    |                    +---> ["Done When" Criteria Display]
    |                    |
    |                    +---> [Notes Field]
    |                    |
    |                    +---> [Weekly Scorecard Ratings]
    |                              |
    |                              +---> [Scorecard Visualization] (needs multiple scored weekends)
    |
    +---> ["Suggest Next Weekend" Logic] (needs completion state from checkboxes)
    |
    +---> [Category Grouping] (independent, structural/layout only)
    |
    +---> [Bonus Weekend Support] (same structure as other weekends, flagged differently)

[Apple-Inspired Design] --- applies across ALL features, not a dependency but a constraint

[Responsive Design] --- applies across ALL features, must be considered from the start

[Vercel Deployment] --- independent, can happen at any phase
```

### Dependency Notes

- **Cloud Persistence is the foundation:** Every feature that saves or reads user data depends on the database being set up first. This is the single prerequisite for all interactive features.
- **Weekend List View is the shell:** All per-weekend features (detail view, notes, scorecard, checkboxes) attach to the list view as the primary navigation surface.
- **Completion Checkboxes enable Progress Bar:** The progress bar reads from completion state. Without checkboxes persisting to the DB, the progress bar has nothing to calculate.
- **Scorecard Visualization requires scorecard data:** This only becomes meaningful after 3+ weekends are scored. It is a late-stage feature that should not block MVP.
- **"Suggest Next Weekend" reads completion state:** It needs to know which weekends are done. It does not depend on scorecard data, only on the boolean completion status per weekend.
- **Apple-Inspired Design is a constraint, not a feature:** It must be established in the first phase (design tokens, typography, spacing system) and then maintained. It is not something "added later" -- retroactively making a utilitarian app look like Apple is a rewrite.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to make the tracker usable and trustworthy on day one. Matches the PDF's "Done When" for Weekend 1: "Your tracker is live on the internet, you've logged Weekend 1, and you trust you'll actually use it."

- [x] **Weekend list view with all 10 weekends** -- the spine of the app
- [x] **Completion checkboxes** -- the primary interaction
- [x] **Overall progress bar** -- visual motivation and at-a-glance status
- [x] **Weekend detail view** -- reference the PDF content without opening the PDF
- [x] **Notes field per weekend** -- capture context while working
- [x] **Cloud persistence** -- data survives browser clears and device switches
- [x] **Apple-inspired design system** -- established from day one, not retrofitted
- [x] **Responsive layout** -- works on phone and desktop
- [x] **Deployed on Vercel** -- live on the internet

### Add After Validation (v1.x)

Features to add once the core tracker is working and being used.

- [ ] **Weekly scorecard ratings** -- add once at least 1-2 weekends are completed and the user wants to reflect
- [ ] **"Suggest next weekend" logic** -- add once more than 1 weekend is complete and the user faces a choice
- [ ] **"Done when" criteria display** -- add as a callout in the detail view
- [ ] **Category grouping** -- add as a visual enhancement to the list view
- [ ] **Bonus Weekend support** -- add as an optional 11th entry

### Future Consideration (v2+)

Features to defer until the core product has proven its value.

- [ ] **Scorecard visualization across weekends** -- defer until 5+ weekends are scored and the data is worth visualizing
- [ ] **Completion celebration** -- defer until someone is close to finishing; premature optimization of delight
- [ ] **Export/share progress as image** -- only if sharing desire materializes
- [ ] **Quick-entry mode** -- optimize only after observing friction in actual scorecard usage

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Weekend list view | HIGH | LOW | P1 |
| Completion checkboxes | HIGH | LOW | P1 |
| Overall progress bar | HIGH | LOW | P1 |
| Weekend detail view | HIGH | LOW-MEDIUM | P1 |
| Notes field per weekend | HIGH | LOW | P1 |
| Cloud persistence | HIGH | MEDIUM | P1 |
| Apple-inspired design system | HIGH | MEDIUM | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Vercel deployment | HIGH | LOW | P1 |
| Weekly scorecard ratings | MEDIUM-HIGH | MEDIUM | P2 |
| "Suggest next weekend" logic | MEDIUM-HIGH | MEDIUM | P2 |
| "Done when" criteria display | MEDIUM | LOW | P2 |
| Category grouping | MEDIUM | LOW | P2 |
| Bonus Weekend support | MEDIUM | LOW | P2 |
| Scorecard visualization | MEDIUM | MEDIUM | P3 |
| Completion celebration | LOW-MEDIUM | LOW | P3 |
| Quick-entry mode | LOW-MEDIUM | LOW-MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- the app is not functional without these
- P2: Should have -- add in the first iteration after launch to reach the full vision
- P3: Nice to have -- add if there is time and the core is solid

---

## Competitor Feature Analysis

| Feature | Todoist | Habitica | Streaks (iOS) | Course Trackers (Udemy/Moodle) | Our Approach |
|---------|---------|----------|---------------|-------------------------------|--------------|
| Item list / overview | Projects with tasks | Habits/Dailies/Todos | Up to 24 tasks | Course modules with lessons | 10 fixed weekends grouped by category |
| Completion tracking | Checkbox per task | Check-off with XP reward | Daily streak rings | Per-lesson completion | Simple checkbox, persisted to cloud |
| Progress visualization | Karma points + productivity charts | Health bar, XP bar, level | Streak count + ring fill | Progress bar per course + overall | Single progress bar (X/10) + per-category indicators |
| Notes / reflection | Task comments | None (just check-off) | None | Forum posts per lesson | Free-text notes field per weekend |
| Rating / scoring | None | Implicit (XP gain/loss) | None | Quiz scores | 4-axis scorecard (Outcome Quality, Time Saved, Repeatability, Use Again) |
| Recommendation | Smart scheduling via date parsing | Quest suggestions | None | "Continue where you left off" | Rule-based "suggest next weekend" based on dependencies and completion |
| Design philosophy | Functional minimalism | Gamified/playful | Apple-native minimalism | Utilitarian/functional | Apple-inspired minimalism with generous whitespace |
| Gamification | Light (karma) | Heavy (RPG, pets, quests) | Light (streak motivation) | Certificates, badges | None -- progress bar IS the game |
| Data model | Open-ended (user creates everything) | Open-ended (user creates habits) | User defines tasks | Course creator defines structure | Fixed structure (10 weekends from PDF) enriched with user data |

**Key insight from competitor analysis:** The closest UX precedent is **Streaks on iOS** (Apple-native minimalism, fixed number of items, one-tap interaction) crossed with **Udemy's course progress tracker** (predefined content, completion percentage, module grouping). We are not building Todoist or Habitica -- those are open-ended tools for a different use case.

---

## Sources

- [Toggl -- 11 Best Habit Tracker Apps 2026](https://toggl.com/blog/best-habit-tracker-apps) -- feature landscape for habit trackers
- [Reclaim.ai -- 10 Best Habit Tracker Apps 2026](https://reclaim.ai/blog/habit-tracker-apps) -- standard features and AI trends
- [Reclaim.ai -- 14 Best Goal Tracker Apps 2026](https://reclaim.ai/blog/goal-tracker-apps) -- goal tracking feature expectations
- [UserGuiding -- Progress Trackers and Indicators](https://userguiding.com/blog/progress-trackers-and-indicators) -- progress bar UX patterns
- [UXPin -- How to Design Better Progress Trackers](https://www.uxpin.com/studio/blog/design-progress-trackers/) -- progress tracker design best practices
- [NN/g -- Status Trackers and Progress Updates](https://www.nngroup.com/articles/status-tracker-progress-update/) -- user expectations for progress tracking
- [NN/g -- UX Guidelines for Recommended Content](https://www.nngroup.com/articles/recommendation-guidelines/) -- "suggest next" UX patterns
- [Cohorty -- Simple Habit Tracker Apps (No Features Overwhelm)](https://www.cohorty.app/blog/simple-habit-tracker-apps-no-features-overwhelm-2025) -- anti-patterns in overengineered trackers
- [EverHabit -- 7 Critical Habit Tracking Mistakes](https://everhabit.app/blog/habit-tracking-mistakes) -- streak and tracking anti-patterns
- [Nes Labs -- Habit Trackers: Does Tracking Actually Work?](https://nesslabs.com/habit-trackers) -- research on tracking effectiveness
- [UI-Patterns -- Completeness Meter Design Pattern](https://ui-patterns.com/patterns/CompletenessMeter) -- course completion UX patterns
- [Artsy Course Experts -- Online Course Progress Indicators](https://www.artsycourseexperts.com/online-course-progress-indicators/) -- progress bar patterns for courses
- [Educate-Me -- Learner Progress Tracker](https://www.educate-me.co/learner-analytics) -- learning plan management features
- [Fuzzy Math -- UX Scorecards](https://fuzzymath.com/blog/ux-scorecards/) -- rating scale design (3-point vs 5-point)
- [Smart Interface Design Patterns -- Reviews and Ratings UX](https://smart-interface-design-patterns.com/articles/reviews-and-ratings-ux/) -- rating display patterns
- [Apple App Store -- Streaks](https://apps.apple.com/us/app/streaks-2026-habit-tracker/id6740426283) -- Apple-native minimalist tracker reference
- [Apple App Store -- Blocks Minimal Habit Tracker](https://apps.apple.com/us/app/blocks-minimal-habit-tracker/id1550584642) -- gesture-based minimalist tracker
- [Slant -- Habitica vs Todoist Comparison](https://www.slant.co/versus/4178/4409/~habitica_vs_todoist) -- feature comparison
- [Todoist -- Habit Tracker Extension](https://www.todoist.com/help/articles/use-the-habit-tracker-extension-with-todoist-A0r7wtPfk) -- how Todoist handles habits
- AI Resolution PDF (local) -- source of truth for weekend structure, scorecard criteria, and "done when" definitions

---
*Feature research for: AI Resolution Tracker (Personal 10-Weekend Program Completion Tracker)*
*Researched: 2026-02-07*

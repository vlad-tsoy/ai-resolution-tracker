# AI Resolution Tracker

## What This Is

A personal web app that tracks progress through the 10-Weekend AI Resolution program. Each weekend has a project with a clear deliverable, and this tracker lets you check off completions, take notes, see overall progress, and get suggestions on which weekend to tackle next. Clean, minimal, Apple-inspired design deployed on Vercel with cloud persistence.

## Core Value

A single place to see where I am in the 10-weekend program and what to do next — simple enough that I actually use it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Display all 10 weekends with their project names, deliverables, and "done when" criteria
- [ ] Completion checkboxes — mark weekends as done
- [ ] Notes field per weekend — capture reflections, links, learnings
- [ ] Overall progress bar showing completion across all 10 weekends
- [ ] "Suggest next weekend" logic — recommend which weekend to tackle based on completion state and dependencies
- [ ] Weekend detail view — see full info (the work, advanced modifiers, why it matters)
- [ ] Weekly scorecard — rate Outcome Quality, Time Saved, Repeatability, Use Again per weekend
- [ ] Cloud-persisted data — accessible from any device
- [ ] Deployed live on Vercel
- [ ] Apple-style minimalist design — clean typography, generous whitespace, subtle animations

### Out of Scope

- Multi-user / authentication — personal tool only
- PWA / offline support — defer to later
- Time tracking — not needed for v1
- Mobile app — web-first, responsive design sufficient
- Social features / sharing — personal use

## Context

The tracker is the Weekend 1 project from the "10-Weekend AI Resolution" PDF — a self-guided AI fluency program for 2026. The program has a retro atomic-age visual identity in the PDF, but the tracker itself should be modern and minimal (Apple aesthetic). The 10 weekends are:

1. **The Vibe Code Kickoff** — Build your resolution tracker (this project)
2. **The Model Mapping Project** — Build your personal AI topography
3. **The Deep Research Sprint** — Let AI do a week's research in an afternoon
4. **The Analysis Project** — Turn messy data into actual decisions
5. **The Visual Reasoning Project** — Make AI see and think
6. **The Information Pipeline** — Build your NotebookLM + Gamma stack
7. **The First Automation** — Build your content distribution machine
8. **The Second Automation** — Build your productivity workflow
9. **The Context Engineering Project** — Build your personal AI operating system
10. **The AI-Powered Build** — Build something with AI inside it

Each weekend has: a deliverable, core work steps, advanced modifiers, a "why it matters" rationale, and a "done when" criterion.

There's also a Bonus Weekend: "The Agent Exploration" (Run the Agent Evaluation Gauntlet).

## Constraints

- **Stack**: Next.js + React on Vercel — matches deployment target
- **Database**: Cloud DB (Supabase, PlanetScale, or similar) — data persists across devices
- **Design**: Apple-inspired minimalism — no retro styling, no clutter
- **Scope**: Personal use only — no auth needed, single user

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Apple minimalism over retro PDF style | User preference for clean modern aesthetic | — Pending |
| Cloud DB over localStorage | Access from any device, data safety | — Pending |
| Vercel deployment | Free tier, great DX for Next.js | — Pending |
| No auth for v1 | Single user, reduces complexity | — Pending |

---
*Last updated: 2026-02-07 after initialization*

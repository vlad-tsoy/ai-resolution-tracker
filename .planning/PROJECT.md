# AI Resolution Tracker

## What This Is

A personal web app that tracks progress through the 10-Weekend AI Resolution program. Features interactive checkboxes with optimistic UI, auto-saving markdown notes, weekly scorecards (1-5 ratings + Yes/No), intelligent next-weekend suggestions based on category dependencies, confetti celebrations on completion, spring-animated progress bar, staggered card animations, and score trend visualization. Built with Next.js 16, Neon Postgres, Drizzle ORM, and shadcn/ui. Deployed on Vercel.

## Core Value

A single place to see where I am in the 10-weekend program and what to do next — simple enough that I actually use it.

## Requirements

### Validated

- ✓ Display all 10 weekends with names, deliverables, and completion status — v1.0
- ✓ Completion checkboxes with optimistic UI and auto-completion logic — v1.0
- ✓ Auto-saving notes with markdown preview — v1.0
- ✓ Overall progress bar with spring animation — v1.0
- ✓ "Suggest next weekend" with category dependency order — v1.0
- ✓ Weekend detail view with full info and advanced modifiers — v1.0
- ✓ Weekly scorecard (Outcome Quality, Time Saved, Repeatability, Use Again) — v1.0
- ✓ Cloud-persisted data via Neon Postgres — v1.0
- ✓ Deployed live on Vercel — v1.0
- ✓ Apple-style minimalist design with Motion animations — v1.0

### Active

(None — v1.0 complete. Define in next milestone.)

### Out of Scope

- Multi-user / authentication — personal tool only
- PWA / offline support — defer to later
- Time tracking — not needed for v1
- Mobile app — web-first, responsive design sufficient
- Social features / sharing — personal use

## Context

Shipped v1.0 with 3,538 lines of TypeScript/TSX across 6 phases and 14 plans.

**Stack:** Next.js 16.1.6 + React 19.2.4 + Neon Postgres + Drizzle ORM 0.45.1 + shadcn/ui (Nova/Zinc) + Tailwind CSS 4.1.18 + Motion 12.33.0 + Recharts 2.15.4 + canvas-confetti 1.9.4

**Database:** 4 tables (weekends, work_items, done_criteria, scorecard_ratings) with 11 seeded weekends, 80 work items, 11 done criteria

**Production URL:** https://ai-resolution.vercel.app
**Repository:** https://github.com/vlad-tsoy/ai-resolution-tracker

## Constraints

- **Stack**: Next.js 16 + Neon Postgres + Drizzle ORM on Vercel
- **Database**: Neon Postgres with @neondatabase/serverless HTTP driver
- **Design**: Apple-inspired minimalism — Inter font, zinc palette, subtle Motion animations
- **Scope**: Personal use only — no auth needed, single user

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Apple minimalism over retro PDF style | User preference for clean modern aesthetic | ✓ Good |
| Neon Postgres over Supabase | Scale-to-zero, no auto-pause, Vercel partner | ✓ Good |
| Drizzle ORM over Prisma | 7KB bundle, zero cold start, serverless-native | ✓ Good |
| Vercel deployment | Free tier, great DX for Next.js | ✓ Good |
| No auth for v1 | Single user, reduces complexity | ✓ Good |
| Server-first architecture | Server Components + Server Actions from Phase 1 | ✓ Good |
| shadcn/ui Nova style + Zinc | Compact layout, neutral palette, Apple feel | ✓ Good |
| Motion for animations | Spring physics, stagger, page transitions | ✓ Good |
| canvas-confetti for celebration | Lightweight, zero deps, reduced-motion support | ✓ Good |
| Recharts via shadcn/ui chart | Grouped bar chart for score trends | ✓ Good |

---
*Last updated: 2026-02-07 after v1.0 milestone*

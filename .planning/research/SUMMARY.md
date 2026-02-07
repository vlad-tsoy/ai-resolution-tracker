# Project Research Summary

**Project:** AI Resolution Tracker
**Domain:** Personal progress tracker / fixed-program completion tracker
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

This is a personal progress tracker for a finite, predefined program of 10 weekends with known structure, deliverables, and completion criteria. It is fundamentally different from open-ended habit trackers — this is closer to a course completion tracker (like Udemy's progress bar) than a daily habit app (like Habitica). Research reveals that experts build this type of tool as a server-first monolith using Next.js Server Components with minimal client-side JavaScript, focusing on simplicity, data persistence, and visual clarity over complex features.

The recommended approach is a Next.js 16 App Router application with Neon Postgres for serverless-friendly cloud storage, Drizzle ORM for type-safe queries with minimal cold-start overhead, and shadcn/ui components styled with Tailwind v4 for Apple-inspired minimalism. The architecture is intentionally simple: Server Components fetch data directly from the database, Server Actions handle mutations with revalidation, and Client Components exist only for interactive widgets (checkboxes, note editing, scorecards). This avoids the primary failure modes: SPA-style architecture that negates Next.js benefits, connection pooling issues in serverless, and stale cached data after mutations.

Key risks center on serverless-specific concerns: database connection exhaustion (mitigated by Neon's serverless driver), cold start latency (mitigated by Drizzle's 7KB bundle vs Prisma's heavier footprint), and publicly exposed Server Actions (mitigated by input validation and accepting the risk for non-sensitive personal data). The glassmorphism aesthetic requires careful cross-browser testing with proper fallbacks. Security is deliberately lightweight — no authentication for v1, with input validation as the primary defense.

## Key Findings

### Recommended Stack

The stack prioritizes serverless compatibility, fast cold starts, and Apple-minimalist aesthetics. Next.js 16 brings stable Turbopack and React Compiler, Tailwind v4's Oxide engine accelerates builds 5x, and the shadcn/ui "Nova" style provides compact Apple-like components. Neon Postgres offers scale-to-zero with no auto-pause (unlike Supabase's 7-day idle shutdown), making it ideal for a personal project with sporadic usage.

**Core technologies:**
- **Next.js 16.1.6 + React 19.2.4**: Full-stack framework with stable Server Components, Server Actions, and Turbopack — pre-decided requirement
- **Neon Postgres + @neondatabase/serverless**: Scale-to-zero cloud database with HTTP driver for serverless/edge, 0.5GB free, no credit card required
- **Drizzle ORM 0.45.1**: 7KB bundle, zero cold-start penalty, SQL-like syntax, code-first schema — chosen over Prisma for serverless performance
- **shadcn/ui (Nova style) + Radix 1.4.3 + Tailwind v4.1.18**: Copy-paste component system for full ownership, Apple-minimalist aesthetic, Oxide-powered CSS
- **Motion 12.33.0**: Declarative animations for progress bars, completion celebrations, page transitions — the 2026 standard for React animation
- **Supporting**: Zustand 5.0.11 (minimal UI state), Zod 4.3.6 (input validation), date-fns 4.1.0 (date logic), Sonner 2.0.7 (toast notifications)

**What NOT to use:** Redux (overkill), Material UI/Chakra (wrong aesthetic), Firebase/Firestore (wrong data model), Prisma (heavier bundle), Mongoose/MongoDB (needs relational), runtime CSS-in-JS (incompatible with RSC).

### Expected Features

Research distinguishes table stakes (users expect), differentiators (competitive advantage), and anti-features (explicitly avoid).

**Must have (table stakes):**
- Weekend list view (all 10 displayed) — the spine of the app
- Completion checkboxes — binary toggle per weekend
- Overall progress bar — visual "X/10" feedback
- Weekend detail view — show full work items, criteria, notes
- Notes field per weekend — free-text reflection capture
- Weekly scorecard ratings — 4-axis evaluation (Outcome Quality, Time Saved, Repeatability, Use Again)
- Cloud persistence — survives browser clear and device switches
- Responsive design — works on phone, tablet, desktop
- Deployed on Vercel — live on the internet

**Should have (competitive):**
- "Suggest next weekend" logic — intelligent recommendation based on completion state and dependencies
- Category grouping — Foundation / Core Projects / Automation / System & Build structure from the PDF
- "Done when" criteria display — specific completion gates per weekend
- Bonus Weekend support — 11th optional item, excluded from main progress denominator
- Apple-inspired minimalist design — SF Pro or Inter font, generous whitespace, subtle animations, no visual clutter
- Scorecard visualization — trends across completed weekends
- Completion celebration — subtle acknowledgment at 10/10

**Defer (v2+):**
- User authentication (explicitly out of scope for v1)
- Time tracking (not needed for launch)
- PWA/offline support (adds service worker complexity)
- AI-powered insights (ironic but unnecessary for 10 data points)

**Anti-features (do NOT build):**
- Gamification (XP, levels, badges) — violates minimalist aesthetic, adds complexity without supporting the finite program model
- Streak tracking / daily check-ins — wrong grain for weekend-based program
- Reminders / push notifications — creates "habit dependency" anti-pattern
- Social features / sharing / leaderboards — requires auth, privacy controls, shifts motivation from intrinsic to extrinsic
- Custom habits beyond 10 weekends — transforms into generic todo app, loses focus

### Architecture Approach

Server-first monolith: Next.js IS the backend. Server Components query Postgres directly via Drizzle ORM, Server Actions handle mutations with revalidation, Client Components exist only for interactive widgets. No separate API layer. No client-side state management library (server is source of truth). The database schema uses normalized tables (weekends, workItems, doneCriteria, scorecardRatings) with foreign key relations rather than JSONB blobs, enabling individual item updates without reading/writing entire documents.

**Major components:**
1. **Server Components (pages)** — Fetch data directly from Neon Postgres using Drizzle queries, render HTML on the server, stream to the client
2. **Client Components (interactive widgets)** — Checkbox toggles, note editor with auto-save, scorecard rating inputs — use `useState` for ephemeral UI state, call Server Actions for persistence
3. **Server Actions (mutations)** — All create/update/delete operations marked with `"use server"`, validate inputs with Zod, call `revalidatePath()` after writes
4. **Data Layer (Drizzle + Neon)** — Schema defined in `db/schema.ts`, connection singleton in `lib/db.ts`, typed queries in `lib/queries.ts`, serverless HTTP driver for edge compatibility

**Project structure:** `app/` for routing (thin pages), `components/` for UI (split into `ui/` for generic primitives and `weekend/` for domain components), `lib/` for business logic (actions, queries, algorithms), `db/` for schema and migrations, `types/` for shared TypeScript interfaces.

**Data flow:** Browser requests page → Next.js Server Component queries Neon directly → HTML renders with data → streams to browser → Client Components hydrate → user interacts → Client Component calls Server Action → Server Action updates DB and revalidates → Server re-renders with fresh data → UI updates.

### Critical Pitfalls

Research identified 6 critical pitfalls that must be addressed from day one:

1. **SPA-style architecture** — Treating Next.js like Create React App (everything client-rendered, data fetching in `useEffect`) negates server benefits. **Avoidance:** Default to Server Components, add `"use client"` only to leaf-node interactive components, fetch data in `async` Server Components.

2. **Exposed Server Actions** — Server Actions are public HTTP endpoints; without auth, anyone can call them and modify the database. **Avoidance:** Accept the risk for personal non-sensitive data OR add lightweight secret token validation, always validate inputs with Zod, use `serverActions.allowedOrigins` in `next.config.js`.

3. **Connection pooling in serverless** — Vercel functions open new DB connections per invocation; without pooling, you hit "too many connections" errors. **Avoidance:** Use Neon's `@neondatabase/serverless` HTTP driver (designed for serverless), not raw TCP Postgres connections.

4. **Stale cached data after mutations** — User checks a box but the UI shows old state on reload because Next.js serves cached pages. **Avoidance:** Call `revalidatePath('/path')` after every Server Action that writes data; use `useOptimistic()` for instant UI feedback.

5. **Cold start latency** — ORM choice directly impacts serverless cold start time; Prisma historically added 1-3 seconds. **Avoidance:** Use Drizzle ORM (7KB, zero binary dependencies) instead of Prisma for negligible cold start overhead.

6. **Glassmorphism broken on devices** — `backdrop-filter: blur()` looks perfect in Chrome DevTools but breaks on Safari or lower-end devices (illegible text, janky scroll). **Avoidance:** Pair every blur with semi-transparent solid overlay (`bg-white/70`), use `@supports` fallbacks, keep blur subtle (`backdrop-blur-md` max), test on real mobile Safari.

**Technical debt to avoid:** Using `localStorage` (violates cloud persistence requirement), hardcoding weekend data in components (not extensible), skipping input validation (security risk), using `any` types (runtime errors), adding `"use client"` as a quick fix instead of extracting interactive pieces.

## Implications for Roadmap

Based on combined research, the roadmap should follow a strict dependency order: database foundation first (all features depend on data), read path second (display before interaction), write path third (core CRUD loop), polish last (meaningless without working features). The architecture demands a server-first pattern be established from the start — retrofitting later is a rewrite.

### Phase 1: Foundation & Data Layer
**Rationale:** Database schema is the prerequisite for all features. Server-first architecture must be established upfront — cannot retrofit from SPA pattern. Serverless connection handling and input validation must be decided before any mutations are written.

**Delivers:**
- Neon Postgres provisioned with schema (weekends, workItems, doneCriteria, scorecardRatings)
- Drizzle ORM configured with serverless driver
- Seed script populating 10 weekends with static content
- Database deployed and accessible from Vercel
- Environment variables configured
- Design system tokens (typography, spacing, colors) for Apple-minimalist aesthetic

**Addresses:**
- Cloud persistence (table stakes feature)
- Foundation for all other features

**Avoids:**
- Pitfall 1 (SPA architecture) — establish Server Components from start
- Pitfall 2 (exposed actions) — set up Zod validation pattern
- Pitfall 3 (connection pooling) — use Neon serverless driver
- Pitfall 5 (cold starts) — choose Drizzle over Prisma
- Pitfall 6 (glass effects) — define design tokens with fallbacks

### Phase 2: Read Path & Overview
**Rationale:** Display data before enabling interaction. Users need to see the 10-weekend structure before they can check boxes or add notes. The read path establishes the component hierarchy and demonstrates the server-first pattern.

**Delivers:**
- Root layout with global styles, fonts, app chrome
- Dashboard page showing all 10 weekends in grid/list view
- Weekend detail page showing full content per weekend
- Progress bar component showing X/10 completion
- Category grouping (Foundation / Core Projects / Automation / System & Build)
- Loading skeletons (Suspense boundaries)

**Addresses:**
- Weekend list view (table stakes)
- Weekend detail view (table stakes)
- Overall progress bar (table stakes)
- Category grouping (differentiator)
- Responsive design (table stakes) — built mobile-first from start

**Uses:**
- Drizzle queries from Phase 1
- shadcn/ui components for layout and cards
- Server Components for all pages

### Phase 3: Write Path & Core Interactions
**Rationale:** Now that users can see their data, enable modification. The core CRUD loop (check box → save to DB → revalidate → UI updates) is the app's beating heart. This phase validates that mutations work correctly and persist across sessions.

**Delivers:**
- Completion checkbox toggle (Server Action + revalidation)
- Notes field with auto-save debouncing
- Optimistic UI for checkboxes (instant feedback)
- "Done when" criteria display per weekend
- Server Actions with Zod input validation
- Revalidation after every mutation

**Addresses:**
- Completion checkboxes (table stakes)
- Notes field per weekend (table stakes)
- "Done when" criteria (differentiator)

**Avoids:**
- Pitfall 4 (stale data) — establish revalidation pattern with first mutation
- Pitfall 2 (exposed actions) — implement Zod validation before any writes

### Phase 4: Scorecard & Reflection
**Rationale:** Scorecard requires UI design attention (5-point scales, yes/no toggles, text input) and comes after core tracking works. Separating this allows focus on the rating UX without blocking basic functionality.

**Delivers:**
- Scorecard rating widget (4 criteria: Outcome Quality, Time Saved, Repeatability, Use Again)
- Mixed input types (star ratings, sliders, yes/no toggle)
- Auto-save on rating changes
- Quick-entry mode (< 30 seconds to complete)
- Empty state prompts

**Addresses:**
- Weekly scorecard ratings (table stakes)
- Quick-entry mode (differentiator)

### Phase 5: Intelligence & Polish
**Rationale:** Smart features and visual polish are meaningless without the core loop working. "Suggest next weekend" requires completion data from Phases 2-3. Animations and accessibility can be layered on after the interaction patterns are solid.

**Delivers:**
- "Suggest next weekend" algorithm (rule-based: in_progress > not_started, respect dependencies, prefer sequential order)
- Suggestion banner component with rationale display
- Bonus Weekend support (11th optional item, excluded from denominator)
- Completion celebration (subtle animation at 10/10)
- Motion animations (progress bar fill, page transitions, completion state changes)
- Cross-browser testing (glass effects on Safari, mobile Chrome)
- Accessibility audit (ARIA attributes, keyboard navigation, screen reader testing)

**Addresses:**
- "Suggest next weekend" logic (differentiator)
- Bonus Weekend support (differentiator)
- Completion celebration (differentiator)
- Apple-inspired design (differentiator) — finalized here after patterns established
- Responsive design (table stakes) — final cross-device verification

**Avoids:**
- Pitfall 6 (glass effects) — cross-browser validation
- UX pitfalls (no optimistic UI, confusing suggestions) — verify with real usage

### Phase 6: Scorecard Visualization & Deployment Hardening
**Rationale:** Visualization requires multiple scored weekends (data from Phase 4). Deployment hardening (edge cases, error handling, production monitoring) comes last after all features work in happy-path scenarios.

**Delivers:**
- Scorecard visualization across completed weekends (trends, averages, per-criterion breakdowns)
- Export progress state (optional, if sharing desire emerges)
- Error handling for DB unreachable scenarios
- Production environment variable verification
- Final security audit (exposed credentials check, input validation coverage)
- Performance optimization (bundle analysis, Lighthouse audit)

**Addresses:**
- Scorecard visualization (differentiator, v1.x timeframe)
- Deployed on Vercel (table stakes) — final production readiness verification

**Avoids:**
- Pitfall 2 (exposed actions) — final security review
- Performance traps (large bundles, unoptimized images)

### Phase Ordering Rationale

- **Database first** because every feature depends on persisted data. Without schema, nothing else can be built.
- **Read before write** because displaying data correctly is simpler than handling mutations, and it validates the architecture.
- **Core interactions before polish** because animations on broken functionality are lipstick on a pig.
- **Scorecard separated** because it requires unique UI patterns (mixed input types, quick-entry flow) that should not block checkbox toggling.
- **Intelligence last** because "suggest next" requires completion data from earlier phases, and polish features are meaningless without working core.

This order respects architectural dependencies (can't mutate without schema, can't suggest without completion state) and mitigates pitfalls by addressing them in the phases where they first become relevant (connection pooling in Phase 1 with first DB queries, stale data in Phase 3 with first mutations, glass effects in Phase 5 with final polish).

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Scorecard):** Mixed input types (star ratings, sliders, yes/no toggles) — need to research accessible rating UI patterns and auto-save debouncing strategies for multi-field forms.

**Phases with standard patterns (skip phase-specific research):**
- **Phase 1 (Foundation):** Database setup and ORM configuration are well-documented in Neon + Drizzle official guides.
- **Phase 2 (Read Path):** Server Component data fetching and shadcn/ui component usage are covered in Next.js and shadcn docs.
- **Phase 3 (Write Path):** Server Actions with revalidation are standard Next.js patterns with abundant official examples.
- **Phase 5 (Intelligence):** Rule-based suggestion algorithms are straightforward logic (not AI/ML research needed).
- **Phase 6 (Visualization):** Scorecard visualization can use simple bar charts or tables (no complex data viz library needed for 10 data points).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm, official documentation from Next.js/Vercel/Neon/Drizzle, explicit version compatibility confirmed. Tailwind v4 and shadcn/ui latest are production-ready. |
| Features | HIGH | Fixed 10-weekend program with predefined structure (from PDF) makes feature decisions constrained and confident. Course tracker analogues (Udemy, Moodle) provide clear UX precedents. |
| Architecture | HIGH | Server-first monolith with App Router is the documented standard for Next.js 15+. Neon + Drizzle + Vercel is a verified integration with official guides and starter templates. |
| Pitfalls | HIGH | All 6 critical pitfalls sourced from official Vercel/Next.js documentation, cross-referenced with community reports. Connection pooling and Server Action security are explicitly documented risks. |

**Overall confidence:** HIGH

Research is comprehensive with strong official source coverage. The domain (personal progress tracker) is well-understood with clear analogues. The stack (Next.js + Neon + Drizzle + shadcn/ui) is a documented, production-tested combination with Vercel starter templates confirming compatibility. Pitfalls are drawn from official security bulletins and common mistakes documentation, not speculation.

### Gaps to Address

Minor gaps that require validation during implementation but do not block roadmap creation:

- **Scorecard UI pattern:** The PDF defines 4 criteria with mixed input types (2x 1-5 scales, 1x qualitative text, 1x yes/no). Research identified rating scale patterns but did not test a specific shadcn/ui implementation combining these inputs. **Resolution:** Prototype the scorecard widget in Phase 4 before committing to a pattern.

- **"Suggest next weekend" dependencies:** The PDF says the program is "modular — skip or reorder" but also "compounding — later weekends reuse earlier builds." The exact dependency graph (which weekends block which others) is not explicitly defined. **Resolution:** Infer dependencies from the "why this goes first" sections in the PDF during Phase 1 seed script creation. Keep the suggestion algorithm simple (prefer sequential order with prerequisite awareness).

- **Apple-minimalist design specifics:** "Apple-inspired" is a clear aesthetic goal but subjective. Research identified design tokens (SF Pro/Inter font, generous whitespace, subtle animations) but the specific color palette and component styling are open to interpretation. **Resolution:** Use shadcn/ui's "Nova" style preset as the starting point, refine in Phase 1 when establishing design tokens.

- **Authentication strategy for future versions:** Research identified Clerk and NextAuth as Next.js-compatible auth solutions but did not recommend one. **Resolution:** Defer decision until auth is actually needed (v2+). For v1, accept the no-auth risk as documented in Pitfall 2.

None of these gaps block the roadmap. All can be resolved during the relevant phase with minimal research.

## Sources

### Primary (HIGH confidence)
- Next.js 16 official documentation (App Router, Server Components, Server Actions, caching)
- Vercel official blog (common mistakes, security bulletins, serverless best practices)
- Neon official documentation (serverless driver, Vercel integration, free tier limits)
- Drizzle ORM official documentation (schema declaration, Neon HTTP driver, migrations)
- shadcn/ui official documentation (installation, component usage, Tailwind v4 support)
- npm CLI version verification (all package versions confirmed as of 2026-02-07)

### Secondary (MEDIUM confidence)
- Vercel blog: "Common mistakes with the Next.js App Router and how to fix them"
- Next.js blog: "How to Think About Security in Next.js"
- DevTools Academy: "6 Best Serverless SQL Databases (2026)"
- UserGuiding: "Progress Trackers and Indicators" (UX patterns)
- UXPin: "How to Design Better Progress Trackers"
- NN/g: "Status Trackers and Progress Updates"
- Toggl / Reclaim.ai: Habit tracker app feature comparisons (2026)
- BetterStack: Drizzle vs Prisma comparison (bundle size, cold start benchmarks)
- Bytebase: Neon vs Supabase comparison (scale-to-zero vs always-on)

### Tertiary (LOW confidence)
- Medium articles on Next.js architecture patterns (verified against official docs)
- DEV Community and CSS-Tricks on glassmorphism implementation (verified with testing)

---
*Research completed: 2026-02-07*
*Ready for roadmap: yes*

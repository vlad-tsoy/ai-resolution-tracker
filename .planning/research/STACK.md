# Stack Research

**Domain:** Personal progress/habit tracker web app (AI Resolution Tracker)
**Researched:** 2026-02-07
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | Pre-decided. v16 brings Turbopack stable, React Compiler stable, `use cache` for explicit caching. Deployed on Vercel for zero-config hosting. |
| React | 19.2.4 | UI library | Ships with Next.js 16. Includes React Compiler (auto-memoization) and stable Suspense. |
| TypeScript | 5.9.3 | Type safety | Non-negotiable for any 2026 project. Next.js 16 has first-class TS support. |
| Tailwind CSS | 4.1.18 | Utility-first CSS | v4 runs on the Oxide engine (Rust-based, 5x faster builds). CSS-first config replaces `tailwind.config.js`. Native cascade layers, `@property`, `color-mix()`. Perfect for Apple-style design tokens. |

### Database

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Neon Postgres | -- (managed service) | Cloud database | Scale-to-zero = free for idle personal projects. Vercel's official Postgres partner. 0.5 GB free storage, 100 CU-hours/month. No auto-pause like Supabase. No credit card required. |
| @neondatabase/serverless | 1.0.2 | Neon HTTP driver | Enables serverless/edge connections over HTTP instead of TCP. Purpose-built for Vercel's serverless functions. |
| Drizzle ORM | 0.45.1 | Type-safe SQL ORM | 7.4kb bundle, zero dependencies, zero cold-start penalty. Native Neon HTTP driver support. SQL-like syntax = no magic, full control. Code-first schema in TypeScript. |
| drizzle-kit | 0.31.8 | Migration tooling | `drizzle-kit push` for rapid dev, `drizzle-kit generate` + `drizzle-kit migrate` for production. |

### UI Components & Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest (CLI-based) | Component system | Not a package -- copies components into your project for full ownership. Built on Radix + Tailwind. Use `npx shadcn create` for scaffolding with theme presets. Choose "Nova" style for compact, Apple-like layouts. |
| radix-ui | 1.4.3 | Headless primitives | Unified package (replaces individual `@radix-ui/react-*` packages). WAI-ARIA accessible. shadcn/ui builds on top of this. |
| lucide-react | 0.563.0 | Icon library | Default icon set for shadcn/ui. 1500+ clean, consistent icons. Tree-shakeable. |
| class-variance-authority | 0.7.1 | Component variants | Utility for defining component variant styles. Used by shadcn/ui internally. |
| clsx | 2.1.1 | Conditional classnames | Tiny utility for building className strings conditionally. |
| tailwind-merge | 3.4.0 | Tailwind class dedup | Merges Tailwind classes without conflicts. Essential when composing shadcn/ui components. |

### Animation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| motion | 12.33.0 | Animation library | Formerly Framer Motion -- same library, rebranded. Declarative `<motion.div>` API, layout animations, `AnimatePresence` for exit animations, `whileInView` for scroll-triggered effects. 18M+ monthly npm downloads. The standard for React animation in 2026. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | 5.0.11 | Client-side state | Only if you need cross-component state that React state/context can't handle cleanly. ~3KB. For this app: manage UI state like active tab, sidebar open/closed. Most state lives in the DB. |
| zod | 4.3.6 | Schema validation | Validate form inputs, API payloads, environment variables. Drizzle ORM has built-in zod integration for schema-to-validator generation. |
| date-fns | 4.1.0 | Date manipulation | Weekend date calculations, "days until next weekend" logic, date formatting. Tree-shakeable (import only what you use). |
| sonner | 2.0.7 | Toast notifications | Minimal, beautiful toast notifications. Works with shadcn/ui out of the box. For "saved" confirmations, error alerts. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Bundler (built into Next.js 16) | Stable in v16 for both `dev` and `build`. Replaces Webpack. No config needed. |
| ESLint + Next.js config | Linting | Ships with `create-next-app`. Enforces Next.js best practices. |
| Vercel CLI | Deploy & preview | `vercel` for preview deploys, `vercel --prod` for production. Auto-deploys from git push. |

## Installation

```bash
# Scaffold with shadcn/create (handles Next.js + Tailwind + shadcn/ui setup)
npx shadcn create

# Database layer
npm install @neondatabase/serverless drizzle-orm

# Animation
npm install motion

# Supporting libraries
npm install zustand zod date-fns sonner

# Dev dependencies
npm install -D drizzle-kit
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Neon | Supabase | When you need built-in auth, real-time subscriptions, or file storage. Supabase is a BaaS, not just a DB. For this single-user no-auth project, its extra services are wasted complexity. Also: Supabase free tier auto-pauses after 7 days of inactivity. |
| Neon | PlanetScale | When you need MySQL specifically or global sharding for high-traffic apps. PlanetScale killed its free tier, starts at $29/month. Enterprise-focused. Wrong fit for a personal project. |
| Drizzle ORM | Prisma | When team familiarity with Prisma outweighs cold-start concerns, or when using a long-running server (not serverless). Prisma is heavier (~20x larger bundle) and historically had cold-start issues on Vercel, though it has improved in 2026 by dropping its Rust engine. |
| shadcn/ui (Radix) | shadcn/ui (Base UI) | When Base UI reaches stable (currently 1.0.0-rc.0). Base UI is the modern choice from MUI team, but Radix at 1.4.3 is battle-tested. Choose Radix now for stability. |
| shadcn/ui | HeroUI (NextUI) | When you want beautiful defaults with zero customization effort. HeroUI is opinionated and polished but harder to customize for a specific Apple-minimalist look. shadcn/ui gives full code ownership. |
| motion | CSS transitions only | When you only need simple hover/focus effects. For this project, we need progress bar animations, page transitions, and completion celebrations -- Motion is worth the 17KB. |
| zustand | React Context | For very simple state. Context causes re-renders of all consumers on any change. Zustand with selectors gives surgical re-renders. For this small app, either works; zustand is the safer bet if state grows. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux / Redux Toolkit | Massive overkill for a single-user tracker app. 15KB+ bundle, boilerplate-heavy. | zustand (3KB, zero boilerplate) or plain React state |
| Material UI (MUI) | Opinionated Material Design aesthetic is the opposite of Apple minimalism. Large bundle (~80KB+). Forces Material patterns. | shadcn/ui + Tailwind for full design control |
| Chakra UI | Aging runtime CSS-in-JS approach. Performance issues with server components. Ecosystem moving away from it in 2026. | shadcn/ui + Tailwind |
| Firebase / Firestore | Google lock-in, NoSQL when we need relational data (weekends have notes, scores, dependencies). Pricing unpredictable at scale. | Neon Postgres for relational data |
| Mongoose / MongoDB | Document DB is wrong model for structured progress data with relations. No free managed Postgres-equivalent simplicity. | Drizzle ORM + Neon Postgres |
| Prisma (for this project) | ~150KB+ bundle vs Drizzle's 7KB. Cold start overhead on serverless. Code generation step adds complexity. For a simple schema, Drizzle's SQL-like syntax is cleaner. | Drizzle ORM |
| styled-components / Emotion | Runtime CSS-in-JS is incompatible with React Server Components. Performance penalty. The ecosystem has moved to Tailwind. | Tailwind CSS v4 |
| Moment.js | Deprecated. 67KB bundle. Mutable API. | date-fns (tree-shakeable, immutable) |

## Stack Patterns by Variant

**If you later add authentication:**
- Add Clerk (`@clerk/nextjs`) or NextAuth.js -- both integrate cleanly with Next.js 16
- Clerk is the simpler option (hosted auth, generous free tier)
- No need to switch to Supabase just for auth

**If you need real-time sync across devices:**
- Neon does not offer real-time subscriptions
- Add Supabase Realtime as a supplementary service, or use Vercel's server-sent events
- For a single-user app, simple polling or refetch-on-focus (built into React Query / SWR) is sufficient

**If the app grows beyond a personal tracker:**
- The Neon + Drizzle + Next.js stack scales cleanly
- Add connection pooling via Neon's built-in pooler
- Drizzle supports complex queries and joins without N+1 problems

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.1.6 | react@19.2.4 | Next.js 16 requires React 19.2+. Ships together via `create-next-app`. |
| next@16.1.6 | tailwindcss@4.1.18 | Tailwind v4 supported since Next.js 15.2. Full support in v16. |
| shadcn/ui (latest CLI) | tailwindcss@4.1.x | shadcn/ui fully supports Tailwind v4. Uses CSS variables for theming. |
| shadcn/ui (latest CLI) | radix-ui@1.4.3 | Uses unified `radix-ui` package (not individual `@radix-ui/react-*`). |
| drizzle-orm@0.45.1 | @neondatabase/serverless@1.0.2 | Native `neon-http` driver support. First-class integration documented by both Drizzle and Neon. |
| motion@12.33.0 | react@19.2.4 | Motion 12.x is compatible with React 19. No known issues. |
| zustand@5.0.11 | react@19.2.4 | Zustand 5 supports React 19. |

## Sources

**Verified via npm CLI (HIGH confidence):**
- next@16.1.6, react@19.2.4, tailwindcss@4.1.18, drizzle-orm@0.45.1, drizzle-kit@0.31.8, motion@12.33.0, zustand@5.0.11, zod@4.3.6, date-fns@4.1.0, sonner@2.0.7, radix-ui@1.4.3, @base-ui-components/react@1.0.0-rc.0, @neondatabase/serverless@1.0.2, lucide-react@0.563.0, class-variance-authority@0.7.1, clsx@2.1.1, tailwind-merge@3.4.0, typescript@5.9.3
- All versions verified via `npm view <package> version` on 2026-02-07

**Official documentation (HIGH confidence):**
- [shadcn/ui installation - Next.js](https://ui.shadcn.com/docs/installation/next) -- CLI-based setup, Radix or Base UI choice
- [shadcn/ui changelog - Base UI docs (Jan 2026)](https://ui.shadcn.com/docs/changelog/2026-01-base-ui) -- Base UI integration details
- [shadcn/create announcement (Dec 2025)](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create) -- `npx shadcn create` with style presets
- [Neon + Next.js guide](https://neon.com/docs/guides/nextjs) -- Connection patterns for serverless
- [Drizzle ORM + Neon tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) -- Native neon-http driver setup
- [Neon free plan docs](https://neon.com/docs/introduction/plans) -- 100 CU-hours, 0.5 GB, scale-to-zero
- [Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- Oxide engine, CSS-first config
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) -- Turbopack stable, React Compiler stable
- [Motion docs](https://motion.dev/docs/react) -- Rebrand from Framer Motion, React integration

**Web search (MEDIUM confidence, cross-verified):**
- [Drizzle vs Prisma comparison](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/) -- 7KB vs ~150KB bundle size, cold start differences
- [Neon vs Supabase comparison](https://www.bytebase.com/blog/neon-vs-supabase/) -- Scale-to-zero vs always-on, DB-only vs BaaS
- [PlanetScale free tier deprecation](https://planetscale.com/docs/plans/hobby-plan-deprecation-faq) -- No free tier, $29/month minimum
- [Supabase free tier auto-pause](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance) -- 7-day inactivity pause
- [React state management 2026](https://www.syncfusion.com/blogs/post/react-state-management-libraries) -- Zustand as lightweight standard
- [React animation libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries) -- Motion as top choice for React

---
*Stack research for: AI Resolution Tracker (personal progress/habit tracker web app)*
*Researched: 2026-02-07*

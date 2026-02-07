# Pitfalls Research

**Domain:** Personal progress tracker web app (Next.js + Vercel + cloud DB)
**Researched:** 2026-02-07
**Confidence:** HIGH (verified against official docs, multiple sources cross-referenced)

## Critical Pitfalls

### Pitfall 1: Treating the App Router Like a Client-Side SPA

**What goes wrong:**
Developers install Next.js but write it like Create React App -- everything renders on the client, all data fetching happens inside `useEffect`, and nothing uses server features. This results in: a blank page on initial load until JS hydrates, unnecessary client-server round-trips for data that could be fetched server-side, bloated client bundles, and poor Lighthouse scores. For a tracker app with mostly static structure and small dynamic data, this is a massive missed opportunity.

**Why it happens:**
Muscle memory from React SPA development. Most React tutorials still teach `useEffect` + `useState` for data fetching. The App Router's server-first model is a paradigm shift that many developers have not fully internalized.

**How to avoid:**
- Default to Server Components. Every component is a Server Component unless you add `"use client"`.
- Fetch data directly in `async` Server Components using your ORM or database client -- no `useEffect` needed.
- Extract only the interactive parts (checkboxes, note editing, scorecard sliders) into small Client Components.
- Keep the `"use client"` directive at the leaf level of your component tree, not the top.

**Warning signs:**
- `useEffect` calls that fetch data on mount.
- `"use client"` at the top of page-level components.
- Empty pages that "flash" before content appears.
- The entire page is wrapped in a single Client Component.

**Phase to address:**
Phase 1 (Foundation) -- establish the Server Component-first architecture from the start. Set up the page shell, layout, and data-fetching pattern correctly before adding features.

---

### Pitfall 2: Server Actions Are Public HTTP Endpoints -- No Auth Means Anyone Can Write to Your Database

**What goes wrong:**
Server Actions marked with `"use server"` become public POST endpoints. Without authentication, anyone who discovers your endpoint IDs can invoke them with arbitrary arguments. For this project (no auth, publicly deployed on Vercel), that means anyone on the internet could: mark weekends as complete/incomplete, overwrite notes, modify scorecard ratings, or corrupt your data.

**Why it happens:**
The project deliberately excludes authentication to reduce complexity. The `"use server"` directive feels "private" because it lives in server-side code, but it creates a real HTTP endpoint. The Vercel blog and Next.js security docs both explicitly warn that "Server Actions are public HTTP endpoints with no built-in authentication, authorization, or input validation."

**How to avoid:**
- Accept the risk consciously -- for a single-user personal tool with non-sensitive data, this may be an acceptable tradeoff.
- Add a lightweight secret token: store a `TRACKER_SECRET` in Vercel environment variables, pass it as a cookie or header from the client, and validate it in every Server Action. This is not real auth but prevents casual abuse.
- Validate all inputs server-side with Zod -- never trust that the client sent valid data. Even without auth, input validation prevents malformed data from corrupting your database.
- Use `serverActions.allowedOrigins` in `next.config.js` to restrict which origins can call your actions.
- Rate-limit Server Actions to prevent abuse even from legitimate origins.

**Warning signs:**
- Server Actions that directly write to the database without any validation.
- No input validation library (Zod) in the project.
- Database entries appearing that you did not create.

**Phase to address:**
Phase 1 (Foundation) -- decide on the security posture and implement input validation from day one. Add the secret token mechanism if desired. Do not defer this to later.

---

### Pitfall 3: Cloud Database Connection Pooling in Serverless

**What goes wrong:**
Vercel Functions are stateless and short-lived. Every function invocation may open a new database connection. Without connection pooling, you quickly exhaust the database's connection limit, causing "too many connections" errors, timeouts, and intermittent failures. This is the single most common failure mode for Next.js + Vercel + cloud DB projects.

**Why it happens:**
Traditional database drivers (like the default Prisma or pg client) assume a long-lived server process that reuses connections. In serverless, each function invocation is potentially a cold start with a fresh connection. The Vercel docs and multiple community sources confirm this is a persistent issue that trips up most developers.

**How to avoid:**
- Use a database provider with built-in serverless connection pooling:
  - **Neon**: Has a serverless driver (`@neondatabase/serverless`) that uses HTTP or WebSocket connections instead of persistent TCP, designed for serverless.
  - **Supabase**: Provides Supavisor connection pooling out of the box for serverless.
  - **Turso/LibSQL**: HTTP-based by design, no connection pooling needed.
- If using Prisma, use `@prisma/adapter-neon` or similar serverless adapters.
- If using Drizzle, use the HTTP/serverless driver variants (e.g., `drizzle-orm/neon-http`).
- Never use a raw TCP Postgres connection string without a pooler in front of it on Vercel.

**Warning signs:**
- Intermittent "connection refused" or "too many connections" errors in Vercel function logs.
- Queries that work locally but fail in production.
- Slow first requests after periods of inactivity (cold start + connection establishment).

**Phase to address:**
Phase 1 (Foundation) -- choose the database and ORM with serverless connection handling as a primary requirement. This is a day-one architectural decision that is painful to change later.

---

### Pitfall 4: Misunderstanding Next.js Caching Defaults (Stale Data After Mutations)

**What goes wrong:**
After a Server Action writes to the database (e.g., checking off a weekend, saving a note), the UI does not update because the page is still serving cached data. The user checks a box, but when they navigate away and come back, the checkbox is unchecked again. This destroys trust in the app immediately.

**Why it happens:**
In Next.js 15+, `fetch()` requests are NOT cached by default (a change from v14 which cached aggressively). However, full routes can still be pre-rendered and cached. The client-side router cache also retains previously visited pages. Developers forget to call `revalidatePath()` or `revalidateTag()` after mutations, so the cached page is served instead of fresh data.

The Vercel blog lists "forgetting to revalidate data after mutations" as one of the top mistakes with the App Router.

**How to avoid:**
- After every Server Action that writes data, call `revalidatePath('/path')` to invalidate the cached page.
- For more surgical invalidation, use `cacheTag()` on your data-fetching functions and `revalidateTag('tag')` after mutations.
- For immediate UI feedback, use `useOptimistic()` or `useTransition()` in Client Components so the UI updates instantly while the server action runs in the background.
- Test mutations explicitly: check the box, navigate away, navigate back, verify the state persisted.

**Warning signs:**
- UI "snaps back" to a previous state after navigation.
- Data appears to save (no errors) but is not reflected on page reload.
- Server Action completes successfully but the page shows stale content.

**Phase to address:**
Phase 2 (Core features) -- when implementing checkboxes, notes, and scorecard mutations. Establish the revalidation pattern with the very first mutation (checkbox toggle) and reuse it consistently.

---

### Pitfall 5: Choosing the Wrong ORM and Paying with Cold Start Latency

**What goes wrong:**
ORM choice directly impacts cold start time on Vercel's serverless functions. Prisma historically added 1-3 seconds of cold start overhead due to its Rust query engine binary. On the Hobby plan with a 10-second function timeout, losing 2-3 seconds to ORM initialization leaves very little headroom for actual database queries and rendering.

**Why it happens:**
Prisma is the most popular ORM in the Next.js ecosystem and has excellent DX (schema-first, Prisma Studio, migrations). Developers choose it for familiarity without considering the serverless cold start penalty. Note: Prisma has been removing the Rust engine in recent versions, which significantly narrows this gap, but bundle size still matters.

**How to avoid:**
- **Recommended: Use Drizzle ORM.** At ~7kb minified+gzipped with zero binary dependencies, it has negligible cold start impact. It follows a SQL-first approach that gives you full control over generated queries.
- If using Prisma, ensure you are on the latest version (which has removed the Rust engine) and use the appropriate serverless adapter for your database.
- Keep function bundle sizes small -- use `@next/bundle-analyzer` to audit what is shipped.
- Avoid importing heavy libraries in Server Components or Server Actions that run in serverless functions.

**Warning signs:**
- First page load takes 3-5+ seconds after the site has been idle.
- Vercel function logs show high "initialization" time relative to execution time.
- Function timeouts on the Hobby plan (10-second limit).

**Phase to address:**
Phase 1 (Foundation) -- ORM selection is a foundational decision. Choose Drizzle or latest Prisma with serverless adapter before writing any data access code.

---

### Pitfall 6: Backdrop Blur / Glassmorphism Looking Broken on Real Devices

**What goes wrong:**
Apple-style glassmorphism (frosted glass backgrounds, backdrop blur) looks perfect in Chrome DevTools but breaks on real devices: text becomes illegible over busy backgrounds, `backdrop-filter: blur()` does not render on older Safari versions, performance drops on lower-end devices causing janky scrolling, and the effect "collapses" without proper layering (looks like a semi-transparent box, not glass).

**Why it happens:**
Developers test only in Chrome on a high-end laptop. The `backdrop-filter` property has cross-browser inconsistencies. Without a proper layered background, blur has nothing to blur against. Text contrast calculations are different on translucent surfaces than opaque ones.

**How to avoid:**
- Pair every `backdrop-blur` with a semi-transparent solid overlay (`bg-white/70` or `bg-black/50`) to ensure text remains legible regardless of what is behind the glass.
- Use `@supports (backdrop-filter: blur())` or Tailwind's `supports-[backdrop-filter]:` variant to provide fallbacks (solid background for unsupported browsers).
- Keep blur subtle: `backdrop-blur-md` (12px) to `backdrop-blur-lg` (16px) is the sweet spot. More blur causes performance issues; less blur loses the effect.
- Test on real mobile Safari and at least one Android Chrome device.
- Do not apply glass effects to large content areas or scrollable lists -- reserve for navigation bars, cards, and modals.

**Warning signs:**
- Text is hard to read when the background image changes.
- Page stutters when scrolling behind a blurred element.
- Glass effects look like plain semi-transparent boxes (no frosted appearance).
- Layout looks completely different on Safari vs Chrome.

**Phase to address:**
Phase 1 (Foundation) -- establish the design system tokens and glass effect CSS utilities early. Build a visual test page with all glass variants over different backgrounds. Phase 3 (Polish) for final cross-browser/device testing.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `localStorage` instead of a database | Zero setup, instant persistence | Data lost on browser clear, not accessible cross-device, SSR incompatibility requiring `useEffect` workarounds, contradicts project requirement for cloud persistence | Never for this project (cloud persistence is a stated requirement) |
| Hardcoding the 10-weekend data structure in components | Fast to build, no schema needed | Cannot add the Bonus Weekend or reorder without touching multiple files, duplicated data across components | Only for an initial prototype -- extract to a data file or DB within the same phase |
| Using `any` types for database records | Faster development, no type definitions needed | Runtime errors from shape mismatches, no autocomplete, mutation bugs that TypeScript would catch | Never -- define types/schemas from day one with Zod + ORM schema |
| Skipping input validation on Server Actions | Fewer lines of code per action | Data corruption, security vulnerabilities, hard-to-debug errors from malformed data | Never |
| Adding `"use client"` to fix "X is not available in Server Components" | Quick fix for browser API errors | Entire subtree becomes client-rendered, losing server benefits, bundle size grows | Only after extracting the interactive piece into the smallest possible Client Component |
| Putting all styles inline instead of using Tailwind design tokens | Fast prototyping, no abstraction overhead | Inconsistent spacing/colors/fonts across pages, painful redesign | Only for throwaway prototypes, not for this project |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel + Cloud DB | Using a raw TCP connection string without pooling | Use the serverless/HTTP driver variant from your DB provider (Neon serverless driver, Supabase connection pooler, Turso HTTP) |
| Vercel Environment Variables | Using `NEXT_PUBLIC_` prefix for database credentials | Never prefix database URLs or secrets with `NEXT_PUBLIC_`. Only use this prefix for values that are safe to expose in the browser (e.g., a public analytics key). Server-side env vars are accessed in Server Components and Server Actions without the prefix. |
| Vercel Hobby Plan | Assuming unlimited function execution | Hobby plan limits: 10s default function timeout (configurable up to 60s), 1M function invocations/month, 4 CPU-hrs active compute, 100 deployments/day. For a personal tracker these limits are generous, but be aware of the 10s timeout for cold-start-heavy functions. |
| Next.js + Vercel Preview Deployments | Forgetting that each PR/push creates a new preview URL with its own environment | Preview deployments share the same environment variables unless overridden. Test that your database connection works in preview environments, not just production. |
| ORM Migrations on Vercel | Running `prisma migrate deploy` or `drizzle-kit push` manually instead of automating | Set up migration as part of the build step or a separate CI job. For a small personal project, running migrations manually before deploy is acceptable but track what has been applied. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all 10 weekends with all notes/scores on every page load | Slow initial load, large RSC payload | Fetch only summary data for the overview page; fetch full details only on the weekend detail view. Use Suspense boundaries so the page is interactive before all data loads. | Not a scale issue for 10 records, but matters if notes become large (thousands of characters each). Good practice regardless. |
| Rendering the entire page as a single Client Component | Large JS bundle, slow hydration, no streaming | Keep the page shell as a Server Component. Inject small Client Components for interactive pieces (checkbox, note editor). | Immediate -- even 10 items with rich UI can feel sluggish if the entire page hydrates as one unit. |
| CSS animations on `backdrop-filter` during scroll | Janky scrolling, dropped frames, especially on mobile | Use `will-change: backdrop-filter` sparingly. Prefer `transform` and `opacity` animations which are GPU-composited. Avoid animating blur radius. | On any device without a discrete GPU or on mobile Safari. |
| Not using `next/image` for any images or icons | Unoptimized images, layout shift on load | Use `next/image` for any raster images. For icons, use SVGs inline or via a component library. Set explicit `width`/`height` to prevent layout shift. | Even a single large hero image can cause noticeable layout shift and slow LCP. |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Deploying without any access control on a publicly routable URL | Anyone who finds the URL can read your progress data and modify your database via Server Actions | Accept the risk (data is not sensitive) OR add a lightweight token check OR use Vercel's deployment protection (password protection is Pro-plan only, but Vercel Authentication is available on Hobby for non-production deployments) |
| Hardcoding database credentials in source code | Credentials committed to git, visible in Vercel build logs, scannable by bots | Always use Vercel environment variables. Never prefix DB credentials with `NEXT_PUBLIC_`. Use `.env.local` for local development and add it to `.gitignore`. |
| Using `NEXT_PUBLIC_` for the database connection string | Database URL exposed in client-side JavaScript, visible in browser DevTools | Server-side environment variables (no `NEXT_PUBLIC_` prefix) are only available in Server Components, Server Actions, and Route Handlers. The client never sees them. |
| Not validating Server Action inputs | Malformed data written to database, potential injection if using raw SQL | Validate every Server Action argument with Zod schemas. Even for a personal app, this prevents bugs from malformed client state. |
| Running an outdated Next.js or React version with known CVEs | Remote code execution (CVE-2025-55182), source code exposure (CVE-2025-55183), denial of service (CVE-2025-55184) | Pin to patched versions: React >= 19.2.1, Next.js >= latest patched release. Check for security advisories before deploying. |

## UX Pitfalls

Common user experience mistakes in the progress tracker domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No optimistic UI on checkbox toggle | User clicks a checkbox, waits 1-2 seconds for the server round-trip, sees no feedback. Feels broken. | Use `useOptimistic()` to immediately show the checked state, then confirm with the server. Revert on failure. |
| Progress bar that only updates on page reload | User checks off a weekend but the progress bar at the top stays at the old value until refresh. Feels disconnected. | Revalidate the data or use optimistic updates to increment the progress bar immediately when a weekend is checked off. |
| No empty state for notes and scorecard | User sees a blank area and does not know they can interact with it. | Show placeholder text ("Add your reflections...") and a subtle call to action. Make it obvious that the field is editable. |
| Overly complex "suggest next weekend" logic | Suggestions feel arbitrary or confusing. User does not trust the recommendation. | Keep it simple: suggest the first incomplete weekend, optionally considering declared dependencies. Show the reasoning ("Weekend 3 is next because Weekends 1 and 2 are complete"). |
| Dense information layout with no visual hierarchy | All 10 weekends look the same. No sense of progress or accomplishment. | Use visual differentiation: completed weekends get a muted/checked style, the suggested next weekend is highlighted, incomplete weekends are neutral. The progress bar provides the at-a-glance summary. |
| Scorecard that is tedious to fill out | User skips the scorecard because it requires too many clicks or feels like homework. | Use simple star ratings or slider controls. Pre-fill with sensible defaults. Make it optional, not blocking. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Checkbox toggle:** Often missing server-side persistence -- verify the checked state survives a full page reload and a different browser/device.
- [ ] **Notes field:** Often missing debounced auto-save -- verify that partially typed notes are not lost if the user navigates away.
- [ ] **Progress bar:** Often missing accessible ARIA attributes (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`) -- verify with a screen reader.
- [ ] **Responsive layout:** Often missing testing below 375px width (iPhone SE) and above 1440px (ultrawide) -- verify at breakpoint extremes, not just "mobile" and "desktop."
- [ ] **Glass effects:** Often missing fallback for unsupported browsers -- verify with backdrop-filter disabled in DevTools.
- [ ] **Server Actions:** Often missing input validation -- verify by sending malformed data via curl/Postman to the action endpoint.
- [ ] **Database writes:** Often missing error handling -- verify behavior when the database is unreachable (kill the DB connection and check the UI does not crash silently).
- [ ] **Environment variables:** Often missing in Vercel production -- verify that the production deployment has all required env vars set (not just preview/development).
- [ ] **Deploy:** Often missing a check of the production URL after deploy -- verify the live site loads and data persists (not just that the build succeeded).

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SPA-style architecture (everything client-rendered) | MEDIUM | Incrementally convert page-level Client Components to Server Components. Extract interactive pieces into small Client Components. Remove `useEffect` data fetching and replace with `async` Server Components. |
| Stale data after mutations (missing revalidation) | LOW | Add `revalidatePath()` calls after each Server Action. This is a one-line fix per action. |
| Wrong ORM choice (cold start issues) | HIGH | Switching ORMs requires rewriting all data access code and migration files. Mitigate by abstracting data access behind a thin service layer so only the implementation changes. |
| Database connection exhaustion (no pooling) | LOW-MEDIUM | Switch to the serverless/HTTP driver variant of your database client. Usually a connection string change and driver import swap, not a full rewrite. |
| Glass effects broken on mobile | LOW | Add a solid-background fallback and reduce blur intensity. CSS-only fix, no architecture changes. |
| Data corruption from unvalidated Server Actions | MEDIUM-HIGH | Add Zod validation to all actions (LOW cost). Fixing corrupted data depends on whether you have backups (HIGH cost without them). |
| Exposed database credentials | HIGH | Rotate credentials immediately. Remove from source code, add to Vercel env vars, add `.env*` to `.gitignore`. If credentials were committed to git, consider them permanently compromised. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SPA-style architecture | Phase 1: Foundation | Audit: no page-level `"use client"` directives. Data fetching happens in Server Components. |
| Exposed Server Actions | Phase 1: Foundation | All Server Actions have Zod input validation. Optional secret token check implemented. |
| DB connection pooling | Phase 1: Foundation | Test in deployed Vercel environment: 5 rapid page loads do not cause connection errors. |
| Stale data after mutations | Phase 2: Core Features | Every mutation (checkbox, note save, score save) reflects immediately and survives a full page reload. |
| Cold start latency | Phase 1: Foundation | First page load after 10 minutes of inactivity completes in under 3 seconds on Vercel Hobby plan. |
| Glass effects broken | Phase 1: Foundation (design tokens), Phase 3: Polish (cross-browser testing) | Visual QA on Chrome, Safari (macOS and iOS), and Firefox. Fallback renders on `backdrop-filter: none`. |
| Missing optimistic UI | Phase 2: Core Features | Checkbox toggle feels instant (< 100ms visual feedback) even on slow connections. |
| Missing accessibility | Phase 3: Polish | Lighthouse accessibility score >= 90. Progress bar has correct ARIA attributes. |
| Missing input validation | Phase 2: Core Features | Sending malformed data via curl to Server Action endpoints returns a validation error, not a database error. |
| Unpatched CVEs | Phase 1: Foundation | `npm audit` returns no high/critical vulnerabilities. React >= 19.2.1 or latest patched version. |

## Sources

- [Common mistakes with the Next.js App Router and how to fix them -- Vercel Blog](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) (HIGH confidence -- official Vercel source)
- [Next.js Official Docs: Caching and Revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating) (HIGH confidence -- official docs, verified `fetch` is NOT cached by default)
- [Next.js Official Docs: Data Security](https://nextjs.org/docs/app/guides/data-security) (HIGH confidence -- official docs)
- [How to Think About Security in Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions) (HIGH confidence -- official Next.js blog)
- [Vercel Hobby Plan Documentation](https://vercel.com/docs/plans/hobby) (HIGH confidence -- verified limits: 10s default timeout configurable to 60s, 1M invocations, 4 CPU-hrs)
- [Vercel Security Bulletin: CVE-2025-55184 and CVE-2025-55183](https://vercel.com/kb/bulletin/security-bulletin-cve-2025-55184-and-cve-2025-55183) (HIGH confidence -- official security advisory)
- [Next.js Server Action Security -- Arcjet Blog](https://blog.arcjet.com/next-js-server-action-security/) (MEDIUM confidence -- verified against official docs)
- [6 Best Serverless SQL Databases for Developers (2026)](https://www.devtoolsacademy.com/blog/serverless-sql-databases/) (MEDIUM confidence -- multiple sources agree on recommendations)
- [Prisma vs Drizzle ORM in 2026 -- Medium](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c) (MEDIUM confidence -- verified cold start claims against multiple benchmark sources)
- [Apple's Liquid Glass UI Design -- DEV Community](https://dev.to/gruszdev/apples-liquid-glass-revolution-how-glassmorphism-is-shaping-ui-design-in-2025-with-css-code-1221) (MEDIUM confidence -- implementation details verified against CSS-Tricks)
- [Getting Clarity on Apple's Liquid Glass -- CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/) (MEDIUM confidence)
- [Next.js Hydration Errors in 2026 -- Medium](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702) (LOW confidence -- single source, but aligns with official hydration docs)
- [v0: Vibe Coding Securely -- Vercel Blog](https://vercel.com/blog/v0-vibe-coding-securely) (HIGH confidence -- official Vercel, documents exposed secrets problem)

---
*Pitfalls research for: AI Resolution Tracker (Next.js + Vercel + Cloud DB personal progress tracker)*
*Researched: 2026-02-07*

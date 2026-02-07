# Architecture Research

**Domain:** Personal progress tracker web app (Next.js + cloud DB)
**Researched:** 2026-02-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+-----------------------------------------------------------------+
|                     Vercel Edge Network                         |
|   (CDN, static assets, serverless function hosting)             |
+-----------------------------------------------------------------+
         |
+-----------------------------------------------------------------+
|                     Next.js App Router                          |
|  +------------------+  +------------------+  +--------------+   |
|  | Server           |  | Client           |  | Server       |   |
|  | Components       |  | Components       |  | Actions      |   |
|  | (pages, layouts) |  | (interactive UI) |  | (mutations)  |   |
|  +--------+---------+  +--------+---------+  +------+-------+   |
|           |                     |                    |           |
|           +----------+----------+--------------------+           |
|                      |                                           |
|              +-------v--------+                                  |
|              |   Data Layer   |                                  |
|              |  (Drizzle ORM) |                                  |
|              +-------+--------+                                  |
|                      |                                           |
+-----------------------------------------------------------------+
                       |
+-----------------------------------------------------------------+
|                Neon Serverless Postgres                          |
|        (scale-to-zero, branching, free tier)                    |
+-----------------------------------------------------------------+
```

This is a server-first monolith. There is no separate backend -- Next.js IS the backend. Server Components query the database directly. Server Actions handle mutations. Client Components handle interactivity only. This architecture is intentionally simple because the app is a single-user personal tool with no auth requirements.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Root Layout | HTML shell, global styles, font loading | `app/layout.tsx` -- Server Component |
| Dashboard Layout | App chrome (header, navigation between views) | `app/(dashboard)/layout.tsx` -- Server Component |
| Weekend List Page | Fetch and display all 10 weekends with status | `app/(dashboard)/page.tsx` -- Server Component |
| Weekend Detail Page | Show single weekend: work items, scorecard, notes | `app/(dashboard)/weekend/[id]/page.tsx` -- Server Component |
| Interactive Cards | Toggle completion, expand/collapse, edit notes | Client Components (`"use client"`) |
| Scorecard Widget | Rate deliverables on criteria, compute scores | Client Component with local state |
| "Suggest Next" Logic | Analyze completion data, recommend next weekend | Server Action or Server Component |
| Data Layer | DB connection, schema, typed queries | `lib/db.ts`, `db/schema.ts` |
| Server Actions | Create/update/delete mutations with revalidation | `lib/actions.ts` (`"use server"`) |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: <html>, <body>, fonts, global CSS
│   ├── page.tsx                # Landing redirect or home -> dashboard
│   ├── (dashboard)/            # Route group (no URL impact)
│   │   ├── layout.tsx          # Dashboard chrome: header, nav
│   │   ├── page.tsx            # Weekend overview / grid view
│   │   ├── weekend/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Weekend detail view
│   │   └── loading.tsx         # Skeleton for dashboard pages
│   ├── api/                    # Route Handlers (only if needed for external)
│   │   └── suggest/
│   │       └── route.ts        # GET endpoint for "suggest next" (optional)
│   └── globals.css             # Global styles / Tailwind base
├── components/
│   ├── ui/                     # Generic reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── progress-bar.tsx
│   │   └── skeleton.tsx
│   ├── weekend/                # Weekend domain components
│   │   ├── weekend-card.tsx    # Card for overview grid (Client Component)
│   │   ├── weekend-detail.tsx  # Full weekend view (Client Component)
│   │   ├── work-item-list.tsx  # Checkable work items (Client Component)
│   │   ├── scorecard.tsx       # Rating widget (Client Component)
│   │   └── notes-editor.tsx    # Editable notes field (Client Component)
│   └── layout/                 # Layout-level components
│       ├── header.tsx          # App header with title
│       ├── nav.tsx             # Weekend navigation / breadcrumbs
│       └── suggest-banner.tsx  # "Suggested next weekend" banner
├── lib/
│   ├── db.ts                   # Drizzle + Neon connection singleton
│   ├── actions.ts              # Server Actions for all mutations
│   ├── queries.ts              # Reusable typed read queries
│   ├── suggest.ts              # "Suggest next weekend" algorithm
│   └── utils.ts                # Date helpers, score calculations
├── db/
│   ├── schema.ts               # Drizzle schema definitions
│   ├── seed.ts                 # Seed script for 10 weekends
│   └── migrations/             # Generated by drizzle-kit
├── types/
│   └── index.ts                # Shared TypeScript types / interfaces
└── drizzle.config.ts           # Drizzle Kit configuration
```

### Structure Rationale

- **`app/`** contains only routing concerns (pages, layouts, loading states). No business logic lives here -- pages are thin wrappers that fetch data and compose components.
- **`(dashboard)/`** route group keeps all dashboard routes together without adding `/dashboard` to the URL. The app IS the dashboard, so the root URL should show the weekend grid directly.
- **`components/ui/`** holds generic, domain-free UI primitives. These are reusable and have no knowledge of weekends or scorecards.
- **`components/weekend/`** holds domain-specific components. These are Client Components because they handle user interaction (checking items, editing notes, rating scorecards).
- **`lib/`** holds all business logic, database queries, server actions, and utility functions. This is the "brain" of the app.
- **`db/`** holds schema and migration artifacts. Separated from `lib/` because it is a different concern (schema definition vs. runtime queries).
- **`types/`** holds shared TypeScript interfaces. Keep them in one place to avoid circular imports.

## Data Model / Schema Design

### Core Tables

```typescript
// db/schema.ts
import { pgTable, pgEnum, integer, varchar, text,
         boolean, timestamp, jsonb, real } from 'drizzle-orm/pg-core';

// --- Enums ---

export const weekendStatusEnum = pgEnum('weekend_status', [
  'not_started',
  'in_progress',
  'completed',
]);

// --- Tables ---

export const weekends = pgTable('weekends', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  number: integer('number').notNull().unique(),           // 1-10
  name: varchar('name', { length: 255 }).notNull(),       // e.g. "Weekend 3: Ship the Tracker"
  deliverable: text('deliverable').notNull(),              // What must be produced
  status: weekendStatusEnum('status').default('not_started').notNull(),
  notes: text('notes'),                                    // Free-form markdown notes
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workItems = pgTable('work_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  isAdvanced: boolean('is_advanced').default(false).notNull(),  // core vs advanced modifier
  isCompleted: boolean('is_completed').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const doneCriteria = pgTable('done_criteria', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  isMet: boolean('is_met').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scorecardRatings = pgTable('scorecard_ratings', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  criterion: varchar('criterion', { length: 255 }).notNull(),  // e.g. "Code Quality", "Learning"
  rating: real('rating'),                                        // 0.0 - 5.0 (nullable until rated)
  comment: text('comment'),                                      // Optional note per criterion
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Schema Design Rationale

**Why separate tables instead of JSONB for work items / criteria:**
- Separate tables enable individual item toggle (mark one work item done) via simple `UPDATE` with `WHERE id = ?`.
- JSONB would require reading the entire array, modifying it in code, and writing the whole thing back -- prone to race conditions and more complex.
- Individual rows enable fine-grained queries: "How many work items are done across all weekends?" becomes a simple `COUNT` with a `WHERE` clause.
- Drizzle ORM gives full type safety per table. JSONB requires manual type assertions.

**Why `real` for scorecard ratings instead of `integer`:**
- Allows half-point ratings (3.5 out of 5) without multiplying by 10.
- Floating-point precision is irrelevant at this scale (single user, 10 weekends).

**Why `isAdvanced` boolean instead of a separate table for advanced modifiers:**
- Core work items and advanced modifiers share the same structure (title + completion state).
- A boolean flag is simpler than a separate table. Filter by `isAdvanced` to distinguish them.
- If advanced modifiers later need different fields, promote to a separate table then.

**Why not a single `weekends` table with JSONB columns for everything:**
- This approach (called "document model in a relational DB") eliminates the need for joins but makes individual item updates expensive, prevents useful queries, and loses type safety.
- For a 10-row dataset, performance is irrelevant. Schema clarity and query convenience matter more.

### Entity Relationships

```
weekends (1) ---< (many) workItems
    "Weekend 3" has work items: "Build UI", "Connect DB", etc.

weekends (1) ---< (many) doneCriteria
    "Weekend 3" has criteria: "App loads without errors", "DB connected", etc.

weekends (1) ---< (many) scorecardRatings
    "Weekend 3" has ratings: "Code Quality: 4.0", "Learning: 5.0", etc.
```

All child tables cascade-delete when a weekend is deleted. This keeps the schema clean -- deleting a weekend removes all associated data.

## Architectural Patterns

### Pattern 1: Server-First Data Fetching

**What:** Server Components query the database directly using Drizzle ORM. No API routes needed for reads. The page component IS the data fetching layer.

**When to use:** Every page that displays data (weekend list, weekend detail).

**Trade-offs:** Eliminates client-server waterfalls and API boilerplate. But you cannot refetch on the client without a full page navigation or Server Action + `revalidatePath`.

**Example:**
```typescript
// app/(dashboard)/page.tsx -- Server Component (no "use client")
import { db } from '@/lib/db';
import { weekends, workItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { WeekendCard } from '@/components/weekend/weekend-card';

export default async function DashboardPage() {
  const allWeekends = await db.select().from(weekends).orderBy(weekends.number);

  // Parallel fetch: get work item counts per weekend
  const itemCounts = await db
    .select({
      weekendId: workItems.weekendId,
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${workItems.isCompleted})`,
    })
    .from(workItems)
    .groupBy(workItems.weekendId);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {allWeekends.map((w) => (
        <WeekendCard
          key={w.id}
          weekend={w}
          progress={itemCounts.find(c => c.weekendId === w.id)}
        />
      ))}
    </div>
  );
}
```

### Pattern 2: Server Actions for Mutations

**What:** All create/update/delete operations are Server Actions defined with `"use server"`. Called directly from Client Components. After mutation, `revalidatePath()` refreshes the cached page data.

**When to use:** Every user write operation (toggle work item, update notes, save scorecard rating).

**Trade-offs:** No API route boilerplate. Type-safe function calls. But debugging is harder than traditional REST endpoints, and you cannot easily call them from external tools (use Route Handlers for that).

**Example:**
```typescript
// lib/actions.ts
'use server';

import { db } from '@/lib/db';
import { workItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleWorkItem(itemId: number, isCompleted: boolean) {
  await db
    .update(workItems)
    .set({ isCompleted, updatedAt: new Date() })
    .where(eq(workItems.id, itemId));

  revalidatePath('/');  // Revalidate dashboard to reflect change
}

export async function updateWeekendNotes(weekendId: number, notes: string) {
  await db
    .update(weekends)
    .set({ notes, updatedAt: new Date() })
    .where(eq(weekends.id, weekendId));

  revalidatePath(`/weekend/${weekendId}`);
}
```

### Pattern 3: Thin Pages, Fat Components

**What:** Page files (`page.tsx`) only fetch data and compose components. All rendering logic, interactivity, and styling lives in `components/`. Pages are 10-30 lines.

**When to use:** Always. This is the organizing principle.

**Trade-offs:** Keeps routing concerns separate from UI concerns. Components become testable in isolation. But you have more files to navigate.

**Example:**
```typescript
// app/(dashboard)/weekend/[id]/page.tsx -- Thin page
import { db } from '@/lib/db';
import { weekends, workItems, doneCriteria, scorecardRatings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { WeekendDetail } from '@/components/weekend/weekend-detail';
import { notFound } from 'next/navigation';

export default async function WeekendPage({ params }: { params: { id: string } }) {
  const weekendId = parseInt(params.id);
  const weekend = await db.query.weekends.findFirst({
    where: eq(weekends.id, weekendId),
  });

  if (!weekend) notFound();

  // Parallel fetch all related data
  const [items, criteria, ratings] = await Promise.all([
    db.select().from(workItems).where(eq(workItems.weekendId, weekendId)).orderBy(workItems.sortOrder),
    db.select().from(doneCriteria).where(eq(doneCriteria.weekendId, weekendId)).orderBy(doneCriteria.sortOrder),
    db.select().from(scorecardRatings).where(eq(scorecardRatings.weekendId, weekendId)),
  ]);

  return (
    <WeekendDetail
      weekend={weekend}
      workItems={items}
      doneCriteria={criteria}
      scorecardRatings={ratings}
    />
  );
}
```

## Data Flow

### Read Flow (Page Load)

```
Browser requests /weekend/3
    |
    v
Next.js App Router matches app/(dashboard)/weekend/[id]/page.tsx
    |
    v
Server Component executes (runs on server, never in browser)
    |
    v
Drizzle ORM queries Neon Postgres directly (no API hop)
    |   - SELECT * FROM weekends WHERE id = 3
    |   - SELECT * FROM work_items WHERE weekend_id = 3
    |   - SELECT * FROM done_criteria WHERE weekend_id = 3
    |   - SELECT * FROM scorecard_ratings WHERE weekend_id = 3
    |   (all 4 queries run in parallel via Promise.all)
    v
Server Component renders HTML with data
    |
    v
HTML streams to browser (static parts first, Suspense boundaries resolve)
    |
    v
Client Components hydrate (only interactive parts get JS)
    - WeekendDetail, WorkItemList, Scorecard, NotesEditor
```

### Write Flow (Toggle Work Item)

```
User clicks checkbox on work item "Build the UI"
    |
    v
Client Component calls Server Action: toggleWorkItem(42, true)
    |
    v
Server Action executes on server
    |   - UPDATE work_items SET is_completed = true WHERE id = 42
    v
Server Action calls revalidatePath('/')
    |
    v
Next.js invalidates cached page data
    |
    v
Server re-renders affected Server Components with fresh data
    |
    v
Updated HTML streams to browser, React reconciles the diff
    |
    v
UI updates -- checkbox now shows "checked" with latest server state
```

### "Suggest Next Weekend" Flow

```
User visits dashboard or clicks "What should I work on next?"
    |
    v
Server Component (or Server Action) runs suggest algorithm
    |
    v
Algorithm logic (lib/suggest.ts):
    1. Query all weekends with their work items and done criteria
    2. Filter to status != 'completed'
    3. Score each candidate:
       - Lower weekend number = higher priority (sequential preference)
       - More prerequisites completed = higher readiness
       - Partially started (in_progress) > not_started (finish what you started)
    4. Return top recommendation with rationale string
    |
    v
Render suggestion banner: "Suggested: Weekend 4 -- You finished 3, and 4 builds on it"
```

### State Management

This app does NOT need client-side state management (no Redux, no Zustand, no Context). Here is why:

- **Server is the source of truth.** All data lives in Postgres. Server Components read it. Server Actions write it.
- **No optimistic updates needed.** This is a personal tool, not a collaborative real-time app. A 200ms round-trip for toggle + revalidate is perfectly acceptable.
- **No complex client state.** The only client state is ephemeral UI state: "is this accordion open?", "what text is in this input before I save?" -- handled by `useState` in individual components.

If any component needs shared client state later (e.g., a sidebar filter that affects the grid), use URL search params (`useSearchParams`) rather than a state library. The URL becomes the state, and Server Components can read it.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (this project) | Monolith is perfect. Neon free tier. No caching needed. |
| 10-100 users | Add auth (NextAuth.js). Add `userId` column to tables. Neon free tier still sufficient. |
| 1,000+ users | Add `unstable_cache` or ISR for read-heavy pages. Consider connection pooling. Upgrade Neon plan. |

### Scaling Priorities

1. **First bottleneck (will not happen for this project):** Database connections. Serverless functions open a new connection per invocation. Neon handles this with its serverless driver, but at scale you would add connection pooling.
2. **Second bottleneck (will not happen for this project):** Cold starts. If the Neon database has scaled to zero and a request arrives, there is a ~500ms cold start. For a personal tool this is invisible. For a production app, configure minimum compute.

**Bottom line:** This is a single-user personal tool. Do not optimize for scale. The architecture is designed for simplicity, clarity, and developer speed. Every decision above is intentional to avoid premature complexity.

## Anti-Patterns

### Anti-Pattern 1: Building an API Layer You Do Not Need

**What people do:** Create `app/api/weekends/route.ts`, `app/api/weekends/[id]/route.ts`, etc., then fetch from these in Server Components or Client Components.
**Why it is wrong:** Server Components can query the database directly. Adding an API layer in between creates unnecessary indirection, doubles the code, and adds a network hop (server -> server). Server Actions handle mutations without API routes.
**Do this instead:** Query Drizzle ORM directly in Server Components for reads. Use Server Actions for writes. Only create Route Handlers if you need to expose an API to external consumers (you do not, for a personal tool).

### Anti-Pattern 2: Making Everything a Client Component

**What people do:** Add `"use client"` to every file because they are used to React SPA patterns. Or add it to a parent layout, making the entire subtree client-rendered.
**Why it is wrong:** Ships unnecessary JavaScript to the browser. Loses the ability to fetch data on the server. Negates the primary benefit of Server Components. Increases bundle size and time-to-interactive.
**Do this instead:** Default to Server Components. Add `"use client"` only to components that genuinely need `useState`, `useEffect`, `onClick`, or browser APIs. Keep client components as "leaf nodes" -- small, focused, interactive widgets.

### Anti-Pattern 3: Storing Structured Data as JSONB When You Need to Query It

**What people do:** Put all work items, criteria, and ratings in a single JSONB column on the `weekends` table. "It is simpler -- just one table!"
**Why it is wrong:** Toggling one work item requires reading the entire JSONB blob, finding the item in the array, modifying it, and writing the entire blob back. Aggregation queries ("how many items are done total?") require JSON extraction functions. No foreign key constraints. No individual timestamps.
**Do this instead:** Use separate tables with foreign keys. The schema is slightly more complex but every operation is a targeted `UPDATE` or `SELECT`. Drizzle ORM makes joins and relations ergonomic.

### Anti-Pattern 4: Client-Side State Management for Server Data

**What people do:** Fetch data once, store in Zustand/Redux/Context, and manage all updates client-side with optimistic mutations.
**Why it is wrong for this project:** Introduces a parallel source of truth. State can drift from database. Adds significant complexity (actions, reducers, selectors, cache invalidation). Completely unnecessary for a single-user app with ~10 rows of primary data.
**Do this instead:** Let the server be the source of truth. Server Actions mutate the database. `revalidatePath` refreshes the UI. The only client state is ephemeral UI state (input values, toggle states).

### Anti-Pattern 5: Over-Engineering the Suggestion Algorithm

**What people do:** Build a complex recommendation engine with ML, weighted scoring matrices, or external API calls.
**Why it is wrong:** There are only 10 weekends. The user already knows what they should work on. The "suggest next" feature is a convenience hint, not an AI system.
**Do this instead:** Simple heuristic in a pure function: prioritize `in_progress` over `not_started`, prefer lower numbers (sequential order), boost readiness score based on prerequisite completion. Keep it under 50 lines. Make it deterministic and transparent ("I suggest this because...").

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Neon Postgres | Drizzle ORM via `@neondatabase/serverless` driver | Connection string in `DATABASE_URL` env var. Use serverless driver, not `pg` package, for Vercel serverless compatibility. |
| Vercel | Deployment target, environment variables | Neon integration auto-provisions `DATABASE_URL`. Preview deployments can use Neon branch databases. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Components | Props (Server -> Client) | Pages fetch data, pass as props. No global state bus. |
| Components <-> Server Actions | Direct function call | Client Components import and call Server Actions. Drizzle handles DB. |
| Server Actions <-> DB | Drizzle ORM queries | All DB access goes through `lib/db.ts` singleton. Never raw SQL in components. |
| Pages <-> Queries | Import from `lib/queries.ts` | Reusable query functions. Pages compose them, not write raw Drizzle. |

## Build Order (Dependency Chain)

The following build order reflects real dependencies -- each layer requires the previous one to function.

```
Phase 1: Foundation (must come first)
    Database schema (db/schema.ts)
    DB connection (lib/db.ts)
    Seed script (db/seed.ts)
    Drizzle config + first migration
        WHY FIRST: Everything else depends on data. Cannot build UI without data to display.

Phase 2: Read Path (depends on Phase 1)
    Query functions (lib/queries.ts)
    Root layout + dashboard layout
    Weekend overview page (Server Component, fetches all weekends)
    Weekend detail page (Server Component, fetches one weekend)
        WHY SECOND: Read before write. Get the data displaying correctly before adding interactivity.

Phase 3: Write Path (depends on Phases 1-2)
    Server Actions (lib/actions.ts)
    Client Components: work item toggle, notes editor, scorecard
    Wire Client Components into detail page
        WHY THIRD: Now the user can both see and modify data. The core loop is complete.

Phase 4: Polish + Intelligence (depends on Phases 1-3)
    "Suggest next weekend" algorithm (lib/suggest.ts)
    Suggestion banner component
    Loading skeletons (loading.tsx)
    Apple-style visual polish (typography, spacing, animations)
    Responsive design
        WHY LAST: Polish and smart features are meaningless without the core CRUD loop working.
```

## Sources

- [Next.js Official Docs: App Router](https://nextjs.org/docs/app) -- HIGH confidence
- [Next.js Official Docs: Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) -- HIGH confidence
- [Next.js Official Docs: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) -- HIGH confidence
- [Next.js Official Docs: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) -- HIGH confidence
- [Next.js Official Docs: Data Fetching Patterns](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns) -- HIGH confidence
- [Drizzle ORM: SQL Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration) -- HIGH confidence
- [Drizzle ORM: PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) -- HIGH confidence
- [Vercel Postgres + Drizzle Starter Template](https://vercel.com/templates/next.js/postgres-drizzle) -- HIGH confidence
- [Neon for Vercel Marketplace](https://vercel.com/marketplace/neon) -- HIGH confidence
- [DevTools Academy: 6 Best Serverless SQL Databases (2026)](https://www.devtoolsacademy.com/blog/serverless-sql-databases/) -- MEDIUM confidence
- [Next.js Architecture in 2026 -- Server-First Patterns](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) -- MEDIUM confidence
- [Next.js Folder Structure Best Practices (2026 Guide)](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide) -- MEDIUM confidence
- [Next.js App Router Advanced Patterns for 2026](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7) -- LOW confidence
- [MakerKit: Next.js App Router Project Structure](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) -- MEDIUM confidence
- [Strapi: Drizzle ORM with PostgreSQL in Next.js 15](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project) -- MEDIUM confidence

---
*Architecture research for: AI Resolution Tracker -- personal progress tracker web app*
*Researched: 2026-02-07*

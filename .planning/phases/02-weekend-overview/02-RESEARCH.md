# Phase 2: Weekend Overview - Research

**Researched:** 2026-02-07
**Domain:** Next.js Server Components read path -- data fetching, display, navigation, loading states, responsive layout
**Confidence:** HIGH

## Summary

Phase 2 builds the complete read path: an overview page displaying all 10 weekends grouped by category with an overall progress bar, plus a detail view for each weekend. This is a Server Component-first architecture where pages fetch data directly from Neon Postgres via Drizzle ORM, render HTML on the server, and stream it to the client. No client-side state management is needed -- the database is the source of truth for all read operations.

The technical domain is well-understood. Next.js App Router provides `loading.tsx` and `<Suspense>` boundaries for skeleton loading states. Drizzle ORM's relational query API (`db.query.weekends.findMany({ with: { workItems: true } })`) fetches weekends with their related work items in a single query. shadcn/ui provides ready-made Card, Progress, Skeleton, Badge, and Accordion components that align with the Apple-inspired minimalist design. Tailwind CSS responsive utilities (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) handle the mobile-to-desktop layout.

**Primary recommendation:** Use Server Components for all read pages, Drizzle relational queries for data fetching, shadcn/ui primitives for UI, `loading.tsx` for route-level skeletons, and `<Suspense>` boundaries for granular streaming. The detail view should be a separate page route (`/weekend/[id]`), not a modal, for simplicity and deep-linking. Category grouping should use a `category` column on the `weekends` table (or a static mapping by weekend number).

## Standard Stack

Phase 2 uses the stack established in Phase 1 research. No new libraries are needed.

### Core (Already Decided)
| Library | Version | Purpose | Phase 2 Usage |
|---------|---------|---------|---------------|
| Next.js | 16.x | Full-stack framework | Server Components for overview + detail pages, `loading.tsx` for skeletons, dynamic routes for `[id]` |
| React | 19.x | UI library | `<Suspense>` boundaries for granular loading states |
| Drizzle ORM | 0.45.x | Type-safe ORM | Relational queries to fetch weekends with work items, aggregation for progress calculation |
| @neondatabase/serverless | 1.x | DB driver | HTTP connection for serverless data fetching |
| Tailwind CSS | 4.x | Styling | Responsive grid layout, spacing, typography |
| shadcn/ui | latest | Component system | Card, Progress, Skeleton, Badge, Accordion components |

### Supporting (Already Decided)
| Library | Version | Purpose | Phase 2 Usage |
|---------|---------|---------|---------------|
| lucide-react | 0.563.x | Icons | Status icons (check, circle, clock), category icons, navigation arrows |

### Not Needed for Phase 2
| Library | Reason |
|---------|--------|
| motion (Framer Motion) | No animations in Phase 2 -- pure read path. Animations added in Phase 5. |
| zustand | No client-side state needed -- Server Components render from DB data directly. |
| zod | No user input in Phase 2 -- read-only. Validation added in Phase 3 with Server Actions. |

## Architecture Patterns

### Recommended Project Structure (Phase 2 Additions)

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                  # Weekend overview page (Server Component)
│   │   ├── loading.tsx               # Skeleton for overview page
│   │   └── weekend/
│   │       └── [id]/
│   │           ├── page.tsx          # Weekend detail page (Server Component)
│   │           └── loading.tsx       # Skeleton for detail page
│   ├── layout.tsx                    # Root layout (from Phase 1)
│   └── globals.css                   # Global styles (from Phase 1)
├── components/
│   ├── ui/                           # shadcn/ui primitives (from Phase 1)
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── badge.tsx
│   │   └── accordion.tsx
│   ├── weekend/                      # Phase 2 domain components
│   │   ├── weekend-card.tsx          # Card for overview grid
│   │   ├── weekend-grid.tsx          # Grouped grid by category
│   │   ├── weekend-detail.tsx        # Full weekend view
│   │   ├── work-item-list.tsx        # Read-only work items display
│   │   ├── progress-overview.tsx     # Overall progress bar
│   │   └── category-section.tsx      # Category group header + cards
│   └── skeletons/                    # Skeleton components
│       ├── weekend-card-skeleton.tsx
│       ├── weekend-grid-skeleton.tsx
│       └── weekend-detail-skeleton.tsx
├── lib/
│   ├── db.ts                         # Drizzle + Neon connection (from Phase 1)
│   └── queries.ts                    # Reusable query functions (NEW)
├── db/
│   └── schema.ts                     # Schema with relations (from Phase 1)
└── types/
    └── index.ts                      # Shared types (from Phase 1)
```

### Pattern 1: Server Component Data Fetching (Overview Page)

**What:** The overview page is an async Server Component that fetches all weekends with their work items directly from the database. No API routes, no `useEffect`, no client-side fetching.

**When to use:** Every page that displays data from the database.

**Confidence:** HIGH -- verified via Next.js official docs and Context7

**Example:**
```typescript
// Source: Next.js App Router docs + Drizzle ORM relational queries
// app/(dashboard)/page.tsx
import { Suspense } from 'react';
import { getWeekendsWithProgress } from '@/lib/queries';
import { WeekendGrid } from '@/components/weekend/weekend-grid';
import { ProgressOverview } from '@/components/weekend/progress-overview';
import { WeekendGridSkeleton } from '@/components/skeletons/weekend-grid-skeleton';

export default async function DashboardPage() {
  const weekends = await getWeekendsWithProgress();

  const mainWeekends = weekends.filter(w => w.number <= 10);
  const bonusWeekend = weekends.find(w => w.number > 10);
  const completedCount = mainWeekends.filter(w => w.status === 'completed').length;

  return (
    <div className="space-y-8">
      <ProgressOverview completed={completedCount} total={10} />
      <WeekendGrid weekends={mainWeekends} />
      {bonusWeekend && (
        <section className="mt-12">
          <h2 className="text-lg font-medium text-muted-foreground mb-4">Bonus</h2>
          {/* Render bonus weekend separately */}
        </section>
      )}
    </div>
  );
}
```

### Pattern 2: Drizzle Relational Queries for Nested Data

**What:** Define Drizzle relations between tables, then use `db.query.weekends.findMany({ with: { workItems: true } })` to fetch weekends with their work items in a single optimized query. This avoids N+1 queries and provides fully typed results.

**When to use:** Any query that needs parent + child data (weekends with work items, weekends with done criteria).

**Confidence:** HIGH -- verified via Drizzle ORM Context7 docs

**Example:**
```typescript
// Source: Drizzle ORM docs (Context7 /llmstxt/orm_drizzle_team_llms_txt)
// db/schema.ts -- add relations
import { relations } from 'drizzle-orm';

export const weekendsRelations = relations(weekends, ({ many }) => ({
  workItems: many(workItems),
  doneCriteria: many(doneCriteria),
}));

export const workItemsRelations = relations(workItems, ({ one }) => ({
  weekend: one(weekends, {
    fields: [workItems.weekendId],
    references: [weekends.id],
  }),
}));

export const doneCriteriaRelations = relations(doneCriteria, ({ one }) => ({
  weekend: one(weekends, {
    fields: [doneCriteria.weekendId],
    references: [weekends.id],
  }),
}));
```

```typescript
// Source: Drizzle ORM docs (Context7)
// lib/queries.ts -- reusable query functions
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { weekends } from '@/db/schema';

export async function getWeekendsWithProgress() {
  return db.query.weekends.findMany({
    with: {
      workItems: true,
    },
    orderBy: (weekends, { asc }) => [asc(weekends.number)],
  });
}

export async function getWeekendDetail(weekendId: number) {
  return db.query.weekends.findFirst({
    where: eq(weekends.id, weekendId),
    with: {
      workItems: {
        orderBy: (workItems, { asc }) => [asc(workItems.sortOrder)],
      },
      doneCriteria: {
        orderBy: (doneCriteria, { asc }) => [asc(doneCriteria.sortOrder)],
      },
    },
  });
}
```

**CRITICAL:** For relational queries to work, you must pass the schema (including relations) to the Drizzle client:
```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

### Pattern 3: Dynamic Route for Detail View

**What:** The weekend detail page uses Next.js dynamic routes (`app/(dashboard)/weekend/[id]/page.tsx`). The page is a Server Component that fetches a single weekend by ID with all related data.

**When to use:** The detail view for any individual weekend.

**Confidence:** HIGH -- verified via Next.js official docs (Context7)

**Example:**
```typescript
// Source: Next.js App Router docs (Context7 /vercel/next.js)
// app/(dashboard)/weekend/[id]/page.tsx
import { getWeekendDetail } from '@/lib/queries';
import { WeekendDetail } from '@/components/weekend/weekend-detail';
import { notFound } from 'next/navigation';

export default async function WeekendPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const weekendId = parseInt(id);

  if (isNaN(weekendId)) notFound();

  const weekend = await getWeekendDetail(weekendId);
  if (!weekend) notFound();

  return <WeekendDetail weekend={weekend} />;
}
```

**Note:** In Next.js 16 (App Router), `params` is a Promise and must be awaited. This is a breaking change from earlier versions.

### Pattern 4: Loading States with Skeleton UI

**What:** Two levels of loading states: (1) `loading.tsx` for route-level skeletons shown during page navigation, and (2) `<Suspense>` boundaries for granular component-level streaming.

**When to use:** Every route that fetches data should have a `loading.tsx`. Use `<Suspense>` for independent data sections within a page.

**Confidence:** HIGH -- verified via Next.js official docs

**Example:**
```typescript
// Source: Next.js streaming docs + shadcn/ui Skeleton component
// app/(dashboard)/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Progress bar skeleton */}
      <Skeleton className="h-4 w-full max-w-md" />

      {/* Category section skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((j) => (
              <Card key={j}>
                <CardHeader>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Key rule:** Data fetching must happen INSIDE the Suspense boundary. If you fetch outside and pass as props, Suspense will not trigger.

### Pattern 5: Category Grouping

**What:** Weekends are grouped by category (Foundation, Core Projects, Automation, System & Build) in the overview. The bonus weekend is shown separately.

**When to use:** The overview page layout.

**Confidence:** HIGH -- category mapping is static and known from the PDF

**Implementation options (choose one):**

**Option A: `category` column on the `weekends` table (Recommended)**
Add a `category` varchar column to the weekends schema. Seed data includes the category. This is the cleanest approach because the grouping is stored with the data and could theoretically be dynamic.

```typescript
// db/schema.ts addition
export const weekendCategoryEnum = pgEnum('weekend_category', [
  'foundation',
  'core_projects',
  'automation',
  'system_and_build',
  'bonus',
]);

// Add to weekends table:
category: weekendCategoryEnum('category').notNull(),
```

**Option B: Static mapping by weekend number**
Define a constant map in code. Simpler, but duplicates knowledge.

```typescript
// lib/constants.ts
export const WEEKEND_CATEGORIES = {
  foundation: { label: 'Foundation', weekends: [1, 2] },
  core_projects: { label: 'Core Projects', weekends: [3, 4, 5, 6] },
  automation: { label: 'Automation', weekends: [7, 8] },
  system_and_build: { label: 'System & Build', weekends: [9, 10] },
} as const;
```

**Recommendation:** Use Option A (`category` column) since the schema is being built in Phase 1 and categories are a core display requirement. The seed data already populates weekend content -- adding category is trivial. This keeps the data model self-contained and queryable (e.g., "show me all Foundation weekends").

### Pattern 6: Responsive Grid Layout

**What:** The weekend card grid adapts to screen size: single column on mobile, 2 columns on tablet, 3+ on desktop. Each category section has its own grid.

**When to use:** The overview page layout.

**Confidence:** HIGH -- standard Tailwind CSS responsive pattern

**Example:**
```typescript
// Source: Tailwind CSS docs (responsive design)
// components/weekend/category-section.tsx
import { WeekendCard } from './weekend-card';

type Props = {
  title: string;
  weekends: WeekendWithProgress[];
};

export function CategorySection({ title, weekends }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekends.map((weekend) => (
          <WeekendCard key={weekend.id} weekend={weekend} />
        ))}
      </div>
    </section>
  );
}
```

### Anti-Patterns to Avoid

- **Client-side data fetching for the overview:** Do NOT use `useEffect` + `fetch` to load weekends. Server Components fetch data directly. No loading spinner needed on the client -- the HTML arrives with data already rendered.

- **Modal for detail view:** Parallel routes + intercepting routes for a modal detail view adds significant complexity (slot folders, default.tsx files, stale modal bugs). For this 10-item app, a simple page route (`/weekend/[id]`) with a back button is the right choice. Modals are justified for photo galleries (Instagram) or quick previews, not for content-rich detail views.

- **Fetching all detail data on the overview page:** The overview only needs the weekend name, deliverable one-liner, and completion status (derived from work item counts). Do NOT fetch notes, done criteria descriptions, or scorecard data on the overview -- that belongs in the detail view.

- **Building a custom progress bar:** shadcn/ui provides a `<Progress>` component with proper accessibility (ARIA `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`). Do not build one from scratch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar with ARIA | Custom div with width % | shadcn/ui `<Progress>` component | Handles accessibility attributes, animation, and styling. Built on Radix primitives. |
| Skeleton loading placeholders | Custom animated divs | shadcn/ui `<Skeleton>` component | Provides consistent `animate-pulse` animation, works with Tailwind, composable. |
| Card layout | Custom styled divs | shadcn/ui `<Card>` with CardHeader, CardContent, CardFooter | Consistent padding, border, shadow. Composable sub-components. |
| Status badges | Colored spans | shadcn/ui `<Badge>` with variants | Consistent sizing, accessible, supports `variant` prop for semantic colors. |
| Expandable sections | Custom toggle divs | shadcn/ui `<Accordion>` | Accessible keyboard navigation, animation, multiple/single expand modes. |
| Responsive grid | CSS Grid from scratch | Tailwind `grid grid-cols-*` with responsive prefixes | Mobile-first breakpoints (`sm:`, `md:`, `lg:`, `xl:`) handle all common screen sizes. |
| Route-level loading | Custom loading state management | Next.js `loading.tsx` file convention | Automatically wraps page in `<Suspense>`, handles streaming, prefetched on navigation. |
| Dynamic routes | Custom URL parsing | Next.js `[id]` folder convention | Type-safe params, automatic code splitting, `notFound()` support. |

**Key insight:** Phase 2 is a read-only display phase. Every UI element needed already exists in shadcn/ui or Next.js conventions. The work is composing them correctly, not building anything custom.

## Common Pitfalls

### Pitfall 1: Not Passing Schema to Drizzle Client (Relational Queries Fail)

**What goes wrong:** You define `relations()` in your schema but relational queries (`db.query.weekends.findMany({ with: ... })`) throw "Cannot read properties of undefined" or return empty results.

**Why it happens:** Drizzle's relational query API requires the schema (tables + relations) to be passed to the `drizzle()` constructor. Without `{ schema }`, only the SQL-like API (`db.select().from()`) works, not the relational API (`db.query.*`).

**How to avoid:** Always pass schema when initializing:
```typescript
import * as schema from '@/db/schema';
const db = drizzle(process.env.DATABASE_URL!, { schema });
```

**Warning signs:** `db.query` is undefined or relational queries return unexpected results.

### Pitfall 2: Forgetting That `params` Is a Promise in Next.js 16

**What goes wrong:** You destructure `params` directly (`{ params: { id } }`) and get a TypeScript error or runtime error because `params` is a Promise.

**Why it happens:** Next.js 16 changed `params` from a plain object to a Promise for async rendering optimization. This is a breaking change from earlier versions.

**How to avoid:** Always `await params`:
```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  // ...
}
```

**Warning signs:** TypeScript errors about Promise types on `params`, or "Cannot read property 'id' of [object Promise]" at runtime.

### Pitfall 3: Skeleton Layout Mismatch (Layout Shift)

**What goes wrong:** The skeleton loading state has a different layout than the actual content, causing a visible "jump" when content loads. Cards rearrange, the progress bar moves, sections shift up or down.

**Why it happens:** The skeleton was designed to "look like something is loading" rather than to exactly mirror the real layout dimensions and structure.

**How to avoid:** The skeleton must match the actual content structure precisely:
- Same grid columns at each breakpoint
- Same card heights and widths (approximate)
- Same section spacing
- Same number of placeholder items as real items (or a representative subset)

**Warning signs:** Cumulative Layout Shift (CLS) > 0.1 in Lighthouse. Visual "jump" when content replaces skeleton.

### Pitfall 4: N+1 Queries for Work Item Progress

**What goes wrong:** The overview page fetches all 10 weekends, then makes 10 separate queries to count work items per weekend. On cold starts, this adds 10 * ~50ms = 500ms+ of latency.

**Why it happens:** Using `db.select().from(weekends)` for the list, then looping and fetching work items individually.

**How to avoid:** Use Drizzle relational queries (`db.query.weekends.findMany({ with: { workItems: true } })`) which generate a single SQL query with a lateral join. Or use a single aggregation query:
```typescript
const progress = await db
  .select({
    weekendId: workItems.weekendId,
    total: sql<number>`count(*)`,
    completed: sql<number>`count(*) filter (where ${workItems.isCompleted})`,
  })
  .from(workItems)
  .where(eq(workItems.isAdvanced, false)) // Only count core items
  .groupBy(workItems.weekendId);
```

**Warning signs:** Multiple `SELECT` queries in the Neon query log for a single page load. Slow overview page despite small dataset.

### Pitfall 5: Detail Page Missing `notFound()` for Invalid IDs

**What goes wrong:** Visiting `/weekend/999` or `/weekend/abc` shows a blank page or an unhandled error instead of a proper 404.

**Why it happens:** The dynamic route handler does not validate the ID parameter or handle missing records.

**How to avoid:** Validate the ID is a number, query the database, and call `notFound()` if the record is missing:
```typescript
const weekendId = parseInt(id);
if (isNaN(weekendId)) notFound();
const weekend = await getWeekendDetail(weekendId);
if (!weekend) notFound();
```

Next.js will render the nearest `not-found.tsx` file or the default 404 page.

### Pitfall 6: Bonus Weekend Counted in Progress Percentage

**What goes wrong:** The progress bar shows "4/11 = 36%" instead of "4/10 = 40%" because the bonus weekend is included in the denominator.

**Why it happens:** The query fetches all weekends (including bonus) and divides completed count by total count.

**How to avoid:** Filter to only the 10 main weekends for progress calculation:
```typescript
const mainWeekends = weekends.filter(w => w.number <= 10);
const completedCount = mainWeekends.filter(w => w.status === 'completed').length;
const progressPercent = Math.round((completedCount / 10) * 100);
```

The bonus weekend is displayed separately and does not affect the main progress bar.

## Code Examples

### Example 1: Weekend Card Component

```typescript
// Source: shadcn/ui Card + Badge components (Context7)
// components/weekend/weekend-card.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

type WeekendCardProps = {
  weekend: {
    id: number;
    number: number;
    name: string;
    deliverable: string;
    status: 'not_started' | 'in_progress' | 'completed';
    workItems: { isCompleted: boolean; isAdvanced: boolean }[];
  };
};

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    variant: 'default' as const,
    cardClass: 'opacity-80',
  },
  in_progress: {
    icon: Clock,
    label: 'In Progress',
    variant: 'secondary' as const,
    cardClass: 'ring-2 ring-primary/20',
  },
  not_started: {
    icon: Circle,
    label: 'Not Started',
    variant: 'outline' as const,
    cardClass: '',
  },
};

export function WeekendCard({ weekend }: WeekendCardProps) {
  const config = statusConfig[weekend.status];
  const StatusIcon = config.icon;
  const coreItems = weekend.workItems.filter(w => !w.isAdvanced);
  const completedCore = coreItems.filter(w => w.isCompleted).length;

  return (
    <Link href={`/weekend/${weekend.id}`}>
      <Card className={`transition-colors hover:bg-accent/50 ${config.cardClass}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Weekend {weekend.number}
            </span>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <CardTitle className="text-base">{weekend.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {weekend.deliverable}
          </CardDescription>
          {coreItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {completedCore}/{coreItems.length} core items
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Example 2: Overall Progress Bar

```typescript
// Source: shadcn/ui Progress component (Context7)
// components/weekend/progress-overview.tsx
import { Progress } from '@/components/ui/progress';

type ProgressOverviewProps = {
  completed: number;
  total: number;
};

export function ProgressOverview({ completed, total }: ProgressOverviewProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Overall Progress
        </h2>
        <span className="text-sm font-medium">
          {completed}/{total} weekends &middot; {percent}%
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`${completed} of ${total} weekends completed`}
        className="h-2"
      />
    </div>
  );
}
```

### Example 3: Reusable Query Functions

```typescript
// Source: Drizzle ORM relational queries (Context7)
// lib/queries.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { weekends } from '@/db/schema';

// Overview page: all weekends with work items for progress display
export async function getWeekendsWithProgress() {
  return db.query.weekends.findMany({
    with: {
      workItems: {
        columns: {
          isCompleted: true,
          isAdvanced: true,
        },
      },
    },
    orderBy: (weekends, { asc }) => [asc(weekends.number)],
  });
}

// Detail page: single weekend with all related data
export async function getWeekendById(id: number) {
  return db.query.weekends.findFirst({
    where: eq(weekends.id, id),
    with: {
      workItems: {
        orderBy: (workItems, { asc }) => [asc(workItems.sortOrder)],
      },
      doneCriteria: {
        orderBy: (doneCriteria, { asc }) => [asc(doneCriteria.sortOrder)],
      },
    },
  });
}
```

### Example 4: Detail View Component Structure

```typescript
// components/weekend/weekend-detail.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

type WeekendDetailProps = {
  weekend: {
    number: number;
    name: string;
    deliverable: string;
    status: string;
    workItems: { id: number; title: string; isAdvanced: boolean; isCompleted: boolean }[];
    doneCriteria: { id: number; description: string; isMet: boolean }[];
    // whyItMatters and other text fields from seed data
  };
};

export function WeekendDetail({ weekend }: WeekendDetailProps) {
  const coreItems = weekend.workItems.filter(w => !w.isAdvanced);
  const advancedItems = weekend.workItems.filter(w => w.isAdvanced);

  return (
    <article className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Weekend {weekend.number}</p>
        <h1 className="text-2xl font-bold tracking-tight">{weekend.name}</h1>
        <p className="text-muted-foreground">{weekend.deliverable}</p>
      </header>

      {/* Core Work Items */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Core Work</h2>
        <ul className="space-y-2">
          {coreItems.map(item => (
            <li key={item.id} className="flex items-start gap-3">
              {/* Read-only display in Phase 2; checkboxes become interactive in Phase 3 */}
              <span className="text-muted-foreground">{item.isCompleted ? '✓' : '○'}</span>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Advanced Modifiers (optional) */}
      {advancedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Advanced Modifiers
            <Badge variant="outline">Optional</Badge>
          </h2>
          <ul className="space-y-2">
            {advancedItems.map(item => (
              <li key={item.id} className="flex items-start gap-3 text-muted-foreground">
                <span>{item.isCompleted ? '✓' : '○'}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Done When Criteria */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Done When</h2>
        <ul className="space-y-2">
          {weekend.doneCriteria.map(criterion => (
            <li key={criterion.id} className="text-muted-foreground">
              {criterion.description}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as plain object | `params` as Promise (must `await`) | Next.js 15+ | Every dynamic route page must `await params` |
| `fetch()` cached by default | `fetch()` NOT cached by default | Next.js 15+ | No surprise stale data; opt-in caching with `use cache` |
| Individual `@radix-ui/react-*` packages | Unified `radix-ui` package | 2025 | Single import, smaller node_modules |
| `relations()` function (Drizzle v1 API) | `defineRelations()` function (Drizzle v2 API) | Drizzle 0.45+ | Both APIs work; `defineRelations()` is the newer pattern but `relations()` is fully supported |
| Framer Motion package name | `motion` package name | 2024 | Same library, `import { motion } from 'motion/react'` |

**Note on Drizzle relations API:** Both the v1 `relations()` API and the newer v2 `defineRelations()` API work in Drizzle 0.45.x. The Phase 1 research uses the `relations()` pattern, which is well-documented and stable. Either works; consistency with Phase 1 code matters more than using the newest API.

## Design Guidance

### Visual Status Differentiation (LIST-04)

Each weekend card must show one of three states with clear visual distinction:

| Status | Visual Treatment | Card Style |
|--------|-----------------|------------|
| Completed | Muted/subdued, checkmark icon, success badge | `opacity-80`, completed badge |
| In Progress | Highlighted, clock icon, accent border | `ring-2 ring-primary/20`, active badge |
| Not Started | Neutral, circle icon, outline badge | Default card, outline badge |

This satisfies the Apple aesthetic: subtle, not garish. Status is communicated through opacity, border weight, and icon choice -- not bright colors.

### Category Grouping Layout (LIST-02)

```
┌─────────────────────────────────────────────┐
│  Overall Progress: 4/10 weekends · 40%      │
│  [████████░░░░░░░░░░░░░]                    │
├─────────────────────────────────────────────┤
│                                             │
│  Foundation                                 │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Weekend 1 │  │ Weekend 2 │                │
│  └──────────┘  └──────────┘                 │
│                                             │
│  Core Projects                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Weekend 3 │  │ Weekend 4 │  │ Weekend 5 │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐                               │
│  │ Weekend 6 │                               │
│  └──────────┘                               │
│                                             │
│  Automation                                 │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Weekend 7 │  │ Weekend 8 │                │
│  └──────────┘  └──────────┘                 │
│                                             │
│  System & Build                             │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Weekend 9 │  │Weekend 10│                 │
│  └──────────┘  └──────────┘                 │
│                                             │
│  ── Bonus ──────────────────────────        │
│  ┌──────────┐                               │
│  │  Bonus   │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

### Mobile Layout

On mobile (`< 640px`), cards stack to a single column. The layout remains identical in structure (progress bar, category headers, cards) but collapses to full-width cards.

## Schema Consideration: Adding `category` and `whyItMatters` Fields

The Phase 1 schema (from ARCHITECTURE.md research) includes `weekends`, `workItems`, `doneCriteria`, and `scorecardRatings`. Phase 2 display requirements reveal two additional fields needed on the `weekends` table:

1. **`category`** -- Needed for LIST-02 (group by category). Use a `pgEnum` or `varchar`.
2. **`whyItMatters`** -- Needed for DETAIL-01 (show "why it matters" in detail view). A `text` column.

These should be added to the `weekends` table definition in Phase 1 during schema creation. If Phase 1 is already complete, add via a migration.

```typescript
// Additions to weekends table in db/schema.ts
export const weekendCategoryEnum = pgEnum('weekend_category', [
  'foundation',
  'core_projects',
  'automation',
  'system_and_build',
  'bonus',
]);

// In the weekends pgTable definition:
category: weekendCategoryEnum('category').notNull(),
whyItMatters: text('why_it_matters'),
```

This is a **Phase 1 dependency** -- if the schema does not include these fields, Phase 2 cannot satisfy LIST-02 and DETAIL-01.

## Open Questions

1. **Detail view navigation: dedicated page or same-page expand?**
   - What we know: The requirement says "clicking a weekend opens a detail view." This could be a separate route or an in-page expansion.
   - Recommendation: Use a **separate page** (`/weekend/[id]`). Reasons: deep-linkable, cleaner loading states, full content space, simpler implementation. In-page expansion would require managing collapse/expand state client-side and makes the overview page heavier.
   - Confidence: HIGH -- separate pages are the standard Next.js pattern.

2. **How to calculate progress when no work items are checked yet (all weekends at "not_started")?**
   - What we know: Progress is `completed weekends / 10`. A weekend is "completed" when all core work items are checked.
   - What's unclear: In Phase 2 (read-only), no items can be checked. All weekends will show "not_started" with 0% progress.
   - Recommendation: This is fine. The UI should handle 0% gracefully (empty progress bar, all cards in "not started" state). The UI will come alive in Phase 3 when checkboxes are added.

3. **Should the overview query fetch `whyItMatters` text or only summary fields?**
   - Recommendation: Fetch only summary fields for the overview (name, deliverable, status, work item counts). The `whyItMatters` text is detail-level data. This keeps the overview payload small and the mental model clean.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js` -- Server Components, dynamic routes, `params` as Promise, Suspense, loading.tsx, streaming
- Context7 `/llmstxt/orm_drizzle_team_llms_txt` -- Relational queries, `findMany` with `with`, relations definition, schema with references
- Context7 `/websites/ui_shadcn` -- Card, Progress, Skeleton, Badge, Accordion components with code examples
- [Next.js Official Docs: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js Official Docs: Loading UI and Streaming](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Next.js Official Docs: Dynamic Routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Drizzle ORM: Relational Queries](https://orm.drizzle.team/docs/rqb)
- [Drizzle ORM: Connect to Neon](https://orm.drizzle.team/docs/connect-neon)
- [MDN: ARIA progressbar role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role)

### Secondary (MEDIUM confidence)
- [FreeCodeCamp: Next.js 15 Streaming Handbook](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/) -- Loading skeleton patterns
- [DEV.to: Complete Next.js Streaming Guide](https://dev.to/boopykiki/a-complete-nextjs-streaming-guide-loadingtsx-suspense-and-performance-9g9) -- loading.tsx vs Suspense tradeoffs
- [Tailwind CSS: Grid Template Columns](https://tailwindcss.com/docs/grid-template-columns) -- Responsive grid utilities
- [CodeParrot: Mastering Responsive Layouts with Tailwind Grid](https://codeparrot.ai/blogs/mastering-responsive-layouts-with-tailwind-grid-in-react) -- Nested grid for category grouping

### Tertiary (LOW confidence -- for awareness only)
- [Next.js Parallel and Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) -- Considered and rejected for this use case (modal detail view is overengineered for 10 items)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already decided in Phase 1, no new additions needed
- Architecture patterns: HIGH -- Server Component data fetching, dynamic routes, loading states are well-documented and verified via Context7
- Pitfalls: HIGH -- params Promise change, schema passing, N+1 queries all verified against official sources
- Code examples: HIGH -- all patterns sourced from Context7 (official docs) and shadcn/ui component library
- Design guidance: MEDIUM -- layout structure is clear, but exact visual treatment will depend on the design system established in Phase 1

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving concerns)

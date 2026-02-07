# Phase 6: Visualization & Production Hardening - Research

**Researched:** 2026-02-07
**Domain:** Charting/data visualization (Recharts via shadcn/ui), Drizzle ORM aggregation queries, Next.js error handling & performance optimization
**Confidence:** HIGH

## Summary

Phase 6 adds a visual summary of scores across completed weekends and hardens the app for production use. Research focused on three domains: (1) charting library selection and integration, (2) data aggregation queries for scorecard visualization, and (3) Next.js production hardening (error boundaries, performance, bundle optimization).

The strongest finding is that **shadcn/ui has a built-in Chart component powered by Recharts** that provides `ChartContainer`, `ChartConfig`, `ChartTooltip`, and `ChartLegend` utilities. The project already has chart CSS variables (`--chart-1` through `--chart-5`) defined in `globals.css` with both light and dark mode support. This makes Recharts via shadcn/ui the obvious choice -- zero new design decisions, automatic theme integration, and consistent component API with the rest of the project.

For data aggregation, Drizzle ORM supports `avg()` and `groupBy()` via its SQL builder API (not the relational query API). A single query can compute average scores per criterion across all completed weekends, returning data shaped for direct chart consumption.

For production hardening, Next.js App Router provides file-based error boundaries (`error.tsx`) that catch rendering errors (including failed Server Component database queries) and offer `reset()` for recovery. Combined with `global-error.tsx`, `not-found.tsx`, `loading.tsx` (already partially implemented), and `next/dynamic` for lazy-loading the chart bundle, the app can meet the <3s initial load target while gracefully handling Neon connection issues.

**Primary recommendation:** Install the shadcn/ui `chart` component (which pulls in Recharts as a dependency), use `next/dynamic` with `ssr: false` to lazy-load chart components, write a Drizzle aggregation query for average scores, and add `error.tsx` files at both the dashboard layout and weekend detail levels.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 3.x (latest via shadcn/ui) | SVG charting library | Installed automatically by `shadcn add chart`. React-native component model, SVG rendering, responsive containers. Most popular React charting library (~9.5M weekly downloads). |
| shadcn/ui Chart | latest CLI | Chart wrapper components | Provides `ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartLegend`. Uses project's existing CSS variables (`--chart-1` through `--chart-5`). Does NOT wrap Recharts -- composes with it. |
| next/dynamic | built-in | Lazy loading | Code-splits chart components into separate bundles. `ssr: false` prevents server-rendering DOM-dependent chart code. |
| Drizzle ORM | 0.45.x (existing) | Aggregation queries | `avg()`, `groupBy()`, `sql` template for type-safe aggregate queries on `scorecardRatings` table. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons for error states | Already installed. Use for error/retry UI in error boundaries. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts (via shadcn/ui) | Chart.js (react-chartjs-2) | Canvas-based, lighter (~11KB gzipped), but no shadcn integration, no SVG, harder to theme with CSS variables, requires `ssr: false`. |
| Recharts (via shadcn/ui) | Tremor | Built on Recharts + Tailwind, but adds another abstraction layer. shadcn/ui's chart component serves the same purpose with less overhead. |
| Recharts (via shadcn/ui) | Nivo | Better SSR support, but no shadcn integration. Heavier. Overkill for 4-dimension bar/line charts. |
| Recharts (via shadcn/ui) | Visx (Airbnb) | Maximum flexibility, smallest bundles via modular packages. But much lower-level API, more code to write for simple charts. No shadcn integration. |

**Installation:**
```bash
npx shadcn@latest add chart
```
This installs `recharts` as a dependency and creates `src/components/ui/chart.tsx` with `ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── queries.ts                    # Add getScorecardAverages() aggregation query
├── components/
│   ├── ui/
│   │   └── chart.tsx                 # shadcn/ui chart utilities (installed by CLI)
│   └── weekend/
│       ├── score-trends-chart.tsx    # "use client" - main visualization component
│       └── score-trends-loading.tsx  # Skeleton placeholder while chart lazy-loads
├── app/
│   ├── (dashboard)/
│   │   ├── error.tsx                 # Route-level error boundary (dashboard)
│   │   ├── not-found.tsx             # 404 for dashboard routes
│   │   ├── page.tsx                  # Add chart section (lazy-loaded)
│   │   └── weekend/
│   │       └── [id]/
│   │           └── error.tsx         # Route-level error boundary (weekend detail)
│   ├── global-error.tsx              # Root-level error boundary (catches layout errors)
│   └── not-found.tsx                 # Global 404 page
```

### Pattern 1: Server Component Data Fetching + Client Component Chart

**What:** Fetch aggregated data in a Server Component, pass it as props to a lazy-loaded Client Component chart.
**When to use:** Always, for any data-driven chart in Next.js App Router.

```typescript
// src/lib/queries.ts - Server-side aggregation query
// Source: Drizzle ORM docs (https://orm.drizzle.team/docs/select#aggregations)
import { db } from "@/lib/db";
import { scorecardRatings, weekends } from "@/db/schema";
import { avg, eq, isNotNull, sql } from "drizzle-orm";

export async function getScorecardAverages() {
  return db
    .select({
      weekendNumber: weekends.number,
      weekendName: weekends.name,
      criterion: scorecardRatings.criterion,
      avgRating: sql<number>`cast(avg(${scorecardRatings.rating}) as float)`,
    })
    .from(scorecardRatings)
    .innerJoin(weekends, eq(scorecardRatings.weekendId, weekends.id))
    .where(isNotNull(weekends.completedAt))
    .groupBy(weekends.number, weekends.name, scorecardRatings.criterion)
    .orderBy(weekends.number);
}
```

```tsx
// src/app/(dashboard)/page.tsx - Server Component parent
// Source: Next.js docs (https://nextjs.org/docs/app/guides/lazy-loading)
import dynamic from "next/dynamic";
import { getScorecardAverages } from "@/lib/queries";

const ScoreTrendsChart = dynamic(
  () => import("@/components/weekend/score-trends-chart"),
  {
    ssr: false,
    loading: () => <ScoreTrendsLoading />,
  }
);

export default async function OverviewPage() {
  const scoreData = await getScorecardAverages();
  // ... existing code ...
  return (
    <main>
      {/* existing content */}
      {scoreData.length > 0 && <ScoreTrendsChart data={scoreData} />}
    </main>
  );
}
```

### Pattern 2: shadcn/ui Chart with ChartConfig Theming

**What:** Use `ChartConfig` to map data keys to human-readable labels and CSS variable colors.
**When to use:** Every chart component built with shadcn/ui.

```tsx
// src/components/weekend/score-trends-chart.tsx
// Source: shadcn/ui docs (https://ui.shadcn.com/docs/components/radix/chart)
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  outcome_quality: {
    label: "Outcome Quality",
    color: "var(--chart-1)",
  },
  time_saved: {
    label: "Time Saved",
    color: "var(--chart-2)",
  },
  repeatability: {
    label: "Repeatability",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function ScoreTrendsChart({ data }: { data: ScoreData[] }) {
  // Transform flat query rows into grouped-by-weekend objects for Recharts
  const chartData = transformToChartData(data);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="weekendLabel" />
        <YAxis domain={[0, 5]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="outcome_quality" fill="var(--color-outcome_quality)" />
        <Bar dataKey="time_saved" fill="var(--color-time_saved)" />
        <Bar dataKey="repeatability" fill="var(--color-repeatability)" />
      </BarChart>
    </ChartContainer>
  );
}
```

### Pattern 3: File-Based Error Boundaries

**What:** `error.tsx` files at each route level catch rendering errors and show recovery UI.
**When to use:** Every route that fetches data from an external source (database, API).

```tsx
// src/app/(dashboard)/error.tsx
// Source: Next.js docs (https://nextjs.org/docs/app/getting-started/error-handling)
"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          Unable to load your weekends. This is usually a temporary connection issue.
        </p>
        <button
          onClick={() => reset()}
          className="text-sm underline underline-offset-4 hover:text-primary"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
```

### Anti-Patterns to Avoid
- **Importing Recharts in a Server Component:** Recharts uses D3.js internals that require browser DOM. Always use `"use client"` for chart components. Dynamic import with `ssr: false` is ideal.
- **Using relational queries for aggregations:** Drizzle's `.query.*.findMany()` relational API does NOT support `avg()`, `groupBy()`, or `having()`. Use the SQL builder API (`db.select().from()`) for aggregation queries.
- **Wrapping every component in an error boundary:** Only use `error.tsx` at route segment levels. Don't create custom React Error Boundary classes for individual components unless absolutely necessary.
- **Fetching chart data on the client:** Since this is a Server Component architecture, always fetch scorecard data on the server and pass it as serializable props. No `useEffect` + `fetch` patterns.
- **Hardcoding chart colors:** Use CSS variables (`var(--chart-1)` through `var(--chart-5)`) from the existing theme. This ensures automatic light/dark mode support.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart container | Custom resize observer | `ChartContainer` from shadcn/ui (wraps Recharts `ResponsiveContainer`) | Handles debouncing, aspect ratio, percentage sizing. Already themed. |
| Tooltip styling | Custom hover + absolute positioning | `ChartTooltip` + `ChartTooltipContent` from shadcn/ui | Handles positioning, animation, payload formatting, theme integration. |
| Chart legend | Manual legend div | `ChartLegend` + `ChartLegendContent` from shadcn/ui | Automatic color mapping from `ChartConfig`, responsive layout. |
| Loading skeleton for charts | Empty div with spinner | `Skeleton` component (already installed) sized to match chart | Consistent with existing loading patterns in the app. |
| Data transformation (flat rows to grouped) | Complex reducer | Simple `reduce()` to pivot flat query results | Data shape is small (max 11 weekends x 4 criteria = 44 rows). Keep it simple. |
| Error recovery | Custom retry logic | `error.tsx` with `reset()` function | Framework-level solution, works with Server Components, automatic error boundary wrapping. |

**Key insight:** The shadcn/ui chart component handles the hardest parts of charting integration -- theming, responsiveness, tooltips, and legends. You compose Recharts components directly (not through an abstraction), so there's no lock-in, but you get automatic design consistency.

## Common Pitfalls

### Pitfall 1: Recharts Bundle Size Bloating Initial Load

**What goes wrong:** Importing Recharts statically adds ~60-70KB gzipped to the client bundle, slowing initial page load.
**Why it happens:** Recharts depends on D3 submodules. Even with tree-shaking, importing any chart type pulls in significant shared code.
**How to avoid:** Use `next/dynamic` with `ssr: false` to code-split the chart into a separate bundle loaded on demand. The overview page loads fast with skeleton placeholders, then the chart appears after the chunk loads.
**Warning signs:** Lighthouse performance score drops after adding charts. Bundle analyzer shows recharts in the initial chunk.

### Pitfall 2: Aggregation Query in Relational API

**What goes wrong:** Attempting to use `db.query.scorecardRatings.findMany()` with `avg()` or `groupBy()` fails silently or produces incorrect results.
**Why it happens:** Drizzle's relational query API (`db.query.*`) is designed for relationship traversal, not SQL aggregations. It does not support `avg()`, `sum()`, `count()`, `groupBy()`, or `having()`.
**How to avoid:** Use the SQL builder API: `db.select({ ... }).from(scorecardRatings).groupBy(...)`. This supports all aggregate functions with full type safety.
**Warning signs:** TypeScript errors when trying to add aggregate functions to relational queries. Query returns individual rows instead of grouped summaries.

### Pitfall 3: `error.tsx` Not Catching Layout Errors

**What goes wrong:** An error in `layout.tsx` is not caught by the `error.tsx` in the same directory.
**Why it happens:** Error boundaries catch errors in their *children*. A layout and its error boundary are siblings, not parent-child. The layout wraps the error boundary, so the error boundary cannot catch its wrapper's errors.
**How to avoid:** Use `global-error.tsx` at the app root to catch layout-level errors. This is the only boundary that catches root layout errors. It must define its own `<html>` and `<body>` tags.
**Warning signs:** Database errors in the layout cause a white screen instead of showing the error UI.

### Pitfall 4: Chart Not Rendering Due to Missing Height

**What goes wrong:** The chart renders as a 0-height invisible element.
**Why it happens:** Recharts `ResponsiveContainer` (used by `ChartContainer`) requires an explicit height via CSS. Without `min-h-[VALUE]` on the `ChartContainer`, it collapses.
**How to avoid:** Always set `className="min-h-[300px] w-full"` (or similar) on `ChartContainer`.
**Warning signs:** No chart visible on the page but no errors in console.

### Pitfall 5: Neon Cold Start Connection Timeout

**What goes wrong:** First request after Neon compute is idle for 5+ minutes fails with a connection timeout.
**Why it happens:** Neon's scale-to-zero feature suspends the compute when idle. Reactivation takes a few hundred milliseconds, but the HTTP driver may time out if the timeout is too short.
**How to avoid:** This is mostly handled by the `@neondatabase/serverless` HTTP driver, which has built-in retry logic. For production, ensure the Neon project has connection pooling enabled. The `error.tsx` boundary with `reset()` provides a user-friendly retry path.
**Warning signs:** Intermittent 500 errors on first load after periods of inactivity.

### Pitfall 6: Console Errors in Production from Missing Error Handling

**What goes wrong:** The success criterion requires "no console errors in production." Unhandled promise rejections, failed fetch requests, or missing data edge cases leak errors to the console.
**Why it happens:** Development mode hides some errors that appear in production. Server Actions that throw without try/catch propagate differently.
**How to avoid:** (1) Add `error.tsx` at each route level. (2) Wrap Server Action calls in try/catch. (3) Handle empty states gracefully (zero completed weekends = no chart, not an error). (4) Test with `next build && next start` locally before deploying.
**Warning signs:** Console errors visible when running `next start` locally.

## Code Examples

Verified patterns from official sources:

### Drizzle ORM: Aggregation Query with AVG and GROUP BY
```typescript
// Source: Drizzle ORM docs - https://orm.drizzle.team/docs/select#aggregations
import { db } from "@/lib/db";
import { scorecardRatings, weekends } from "@/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

export async function getScorecardAverages() {
  return db
    .select({
      weekendNumber: weekends.number,
      weekendName: weekends.name,
      criterion: scorecardRatings.criterion,
      avgRating: sql<number>`cast(avg(${scorecardRatings.rating}) as float)`,
    })
    .from(scorecardRatings)
    .innerJoin(weekends, eq(scorecardRatings.weekendId, weekends.id))
    .where(isNotNull(weekends.completedAt))
    .groupBy(weekends.number, weekends.name, scorecardRatings.criterion)
    .orderBy(weekends.number);
}
```

### Data Transformation: Flat Rows to Chart-Ready Shape
```typescript
// Transform flat DB rows to grouped objects for Recharts
// Input:  [{ weekendNumber: 1, criterion: "outcome_quality", avgRating: 4.2 }, ...]
// Output: [{ weekendLabel: "Wk 1", outcome_quality: 4.2, time_saved: 3.8, ... }, ...]

type ScoreRow = {
  weekendNumber: number;
  weekendName: string;
  criterion: string;
  avgRating: number;
};

function transformToChartData(rows: ScoreRow[]) {
  const grouped = new Map<number, Record<string, number | string>>();

  for (const row of rows) {
    if (!grouped.has(row.weekendNumber)) {
      grouped.set(row.weekendNumber, {
        weekendLabel: `Wk ${row.weekendNumber}`,
      });
    }
    const entry = grouped.get(row.weekendNumber)!;
    entry[row.criterion] = Number(row.avgRating.toFixed(1));
  }

  return Array.from(grouped.values());
}
```

### Lazy-Loaded Chart with Dynamic Import
```tsx
// Source: Next.js docs - https://nextjs.org/docs/app/guides/lazy-loading
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ScoreTrendsChart = dynamic(
  () => import("@/components/weekend/score-trends-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    ),
  }
);
```

### Global Error Boundary
```tsx
// Source: Next.js docs - https://nextjs.org/docs/app/getting-started/error-handling
// src/app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background font-sans antialiased">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
```

### Not Found Page
```tsx
// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className="text-sm underline underline-offset-4">
          Back to weekends
        </Link>
      </div>
    </main>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts v2 with shadcn/ui | Recharts v3 with updated shadcn/ui chart | Late 2025 / PR #8486 | `layout` prop moved from `<Bar>` to `<BarChart>`, `activeIndex` replaced by `defaultIndex`, `accessibilityLayer` true by default. |
| `ResponsiveContainer` wrapper | `ChartContainer` from shadcn/ui | shadcn/ui chart component launch | Wraps ResponsiveContainer + adds theme integration via ChartConfig. |
| Static chart imports | `next/dynamic` with `ssr: false` | Next.js App Router best practices | Code-splits chart bundle away from initial page load. Critical for <3s load target. |
| Manual CSS color management | CSS variable theming (`--chart-1` etc.) | shadcn/ui chart component | Automatic light/dark mode. Colors defined once in `globals.css`, referenced everywhere. |
| Custom error handling in components | File-based `error.tsx` boundaries | Next.js 13+ App Router | Framework-managed error isolation. Error boundaries align with route hierarchy. |

**Deprecated/outdated:**
- `recharts@2.x`: Still works but v3 has breaking API changes. shadcn/ui chart component's latest version targets v3. Install via `shadcn add chart` to get the correct pairing.
- Custom `ErrorBoundary` classes: Not needed for route-level errors. Use `error.tsx` convention. Only needed for inline component-level boundaries (rare).

## Key Implementation Notes

### Recharts v3 Breaking Changes (from v2)
These are critical if any existing examples reference Recharts v2:
1. `layout` prop removed from `<Bar />` -- use `layout` on `<BarChart />` instead
2. `activeIndex` removed -- use `defaultIndex` on `<ChartTooltip />`
3. `accessibilityLayer` is `true` by default (good for accessibility, no action needed)
4. All `margin` values (`top`, `right`, `bottom`, `left`) must be explicitly provided

### Chart Data Shape for This Project
The scorecard has 4 criteria: `outcome_quality` (1-5), `time_saved` (1-5), `repeatability` (1-5), `use_again` (0/1). For visualization:
- Show the three 1-5 scale criteria as grouped bars (or lines) per weekend
- `use_again` is binary (yes/no), so it does NOT belong on the same y-axis. Either omit it from the chart or show it separately as a simple indicator
- X-axis: weekends (by number), Y-axis: average rating (0-5)
- Only show weekends that have `completedAt IS NOT NULL`

### Performance Budget
- Target: <3s initial page load on standard connection
- Strategy: Server Components for layout + data fetching (zero client JS), `next/dynamic` for chart (separate chunk), `loading.tsx` skeletons (already exist)
- Recharts bundle: ~60-70KB gzipped when dynamically imported (not blocking initial render)
- The overview page currently uses `force-dynamic` -- consider whether this is still needed or if ISR/static would be better for production

### Existing Infrastructure
Already in place (no changes needed):
- `loading.tsx` for dashboard (skeleton loading)
- `loading.tsx` for weekend detail (skeleton loading)
- Chart CSS variables in `globals.css` (`--chart-1` through `--chart-5`, both light and dark)
- shadcn/ui CLI configured (`components.json` with `new-york` style, zinc base, `rsc: true`)
- Drizzle ORM configured with Neon HTTP driver

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Recharts version installed by `shadcn add chart`**
   - What we know: shadcn/ui PR #8486 updated to Recharts v3. Latest Recharts is v3.7.0. The PR specified v3.2.1.
   - What's unclear: Whether the current published shadcn/ui CLI installs Recharts v3.x or still v2.x. The PR may or may not be merged and released.
   - Recommendation: Run `npx shadcn@latest add chart` and check the installed version. If it installs v2.x, consider manually upgrading to v3.x and applying the chart.tsx patch from the PR.

2. **`force-dynamic` impact on page load performance**
   - What we know: The overview page currently has `export const dynamic = "force-dynamic"` which disables static rendering and caching.
   - What's unclear: Whether this is intentional (needed for fresh data) or a development convenience.
   - Recommendation: For a single-user app with infrequent updates, keeping `force-dynamic` is fine -- the data should always be fresh. The performance impact is minimal since Neon HTTP queries are fast (~50-200ms). If performance becomes an issue, consider `revalidate` with a short ISR window instead.

3. **Bundle size precision for Recharts 3.7.0**
   - What we know: Estimates range from ~60KB to ~70KB minified+gzipped for the full library. Tree-shaking may reduce this for specific chart types.
   - What's unclear: Exact bundled size with Next.js tree-shaking. Only specific chart components are imported, not the entire library.
   - Recommendation: After implementation, run the bundle analyzer to verify. With `next/dynamic` code-splitting, this does not affect initial page load regardless.

## Sources

### Primary (HIGH confidence)
- `/recharts/recharts` (Context7) - LineChart, BarChart, ResponsiveContainer, CustomTooltip, Cell component examples
- `/vercel/next.js` (Context7) - error.tsx, global-error.tsx, not-found.tsx, next/dynamic lazy loading
- `/drizzle-team/drizzle-orm-docs` (Context7) - avg(), groupBy(), SQL builder aggregation queries
- shadcn/ui Chart docs: https://ui.shadcn.com/docs/components/radix/chart - ChartContainer, ChartConfig, ChartTooltip, theming
- Next.js Error Handling: https://nextjs.org/docs/app/getting-started/error-handling - error.tsx, global-error.tsx patterns
- Next.js Production Checklist: https://nextjs.org/docs/app/guides/production-checklist - comprehensive optimization guide
- Next.js Lazy Loading: https://nextjs.org/docs/app/guides/lazy-loading - next/dynamic with ssr: false

### Secondary (MEDIUM confidence)
- shadcn/ui Recharts v3 PR: https://github.com/shadcn-ui/ui/pull/8486/files - chart.tsx changes for v3 compatibility
- shadcn/ui Recharts v3 issue: https://github.com/shadcn-ui/ui/issues/7669 - status of v3 support
- Neon connection errors docs: https://neon.com/docs/connect/connection-errors - cold start behavior, pooling

### Tertiary (LOW confidence)
- Bundle size estimates (~60-70KB gzipped for Recharts) from multiple web search sources -- exact numbers not verified on Bundlephobia for v3.7.0

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - shadcn/ui chart + Recharts is well-documented, project already has theming infrastructure
- Architecture: HIGH - Server Component data fetching + Client Component chart is the canonical Next.js pattern, verified via Context7
- Aggregation queries: HIGH - Drizzle ORM aggregate API verified via Context7 with exact syntax
- Error handling: HIGH - Next.js file-based error boundaries verified via Context7 official docs
- Performance: HIGH - next/dynamic lazy loading pattern verified, <3s target achievable with code-splitting
- Pitfalls: MEDIUM - Recharts v3 / shadcn/ui compatibility is evolving; the installed version may need verification

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stack is stable, shadcn/ui chart integration is maturing)

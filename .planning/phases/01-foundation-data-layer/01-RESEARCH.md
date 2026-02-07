# Phase 1: Foundation & Data Layer - Research

**Researched:** 2026-02-07
**Domain:** Next.js scaffolding, Neon Postgres + Drizzle ORM setup, Tailwind v4 design system, Vercel deployment
**Confidence:** HIGH

## Summary

Phase 1 establishes the technical foundation for the entire application: a deployed Next.js app with a populated Neon Postgres database, an Apple-inspired design system, and server-first architecture patterns. Research focused on four domains: (1) project scaffolding via `npx shadcn create` with the Nova style preset, (2) Drizzle ORM + Neon serverless HTTP driver configuration with schema definition and seed scripts, (3) Tailwind v4 CSS-first design token configuration for Apple-minimalist aesthetics, and (4) Vercel deployment with Neon marketplace integration for automatic environment variable provisioning.

The standard approach is well-documented with official tutorials covering the exact stack (Next.js + Neon + Drizzle + shadcn/ui on Vercel). The primary risk is a known bug in `drizzle-seed` where `generatedAlwaysAsIdentity` columns cause sequence conflicts after seeding -- a straightforward workaround exists (reset sequences via raw SQL after seeding). The scaffolding path via `npx shadcn create` handles Next.js + Tailwind v4 + shadcn/ui setup in a single command, significantly reducing boilerplate configuration.

**Primary recommendation:** Use `npx shadcn create` with the Nova style and zinc base color to scaffold, install Drizzle + Neon packages separately, write a manual seed script (not `drizzle-seed` package) with explicit data from the PDF, push schema via `drizzle-kit push` for initial development, and deploy to Vercel with the Neon marketplace integration for automatic `DATABASE_URL` provisioning.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Full-stack React framework with App Router | Pre-decided. Stable Turbopack, React Compiler. Vercel's native framework. |
| React | 19.2.4 | UI library | Ships with Next.js 16. Includes React Compiler for auto-memoization. |
| TypeScript | 5.9.3 | Type safety | First-class support in Next.js 16. Non-negotiable for 2026. |
| Tailwind CSS | 4.1.18 | Utility-first CSS | v4 Oxide engine (Rust, 5x faster). CSS-first config via `@theme` directive. No `tailwind.config.js` needed. |
| shadcn/ui (Nova style) | latest CLI | Component system | Copy-paste components with full ownership. Nova style = compact, reduced padding. Built on Radix 1.4.3. |
| Neon Postgres | managed service | Cloud database | Scale-to-zero, 0.5GB free, no credit card. Vercel's official Postgres partner. |
| @neondatabase/serverless | 1.0.2 | Neon HTTP driver | Purpose-built for serverless/edge. HTTP connections, not TCP. |
| Drizzle ORM | 0.45.1 | Type-safe SQL ORM | 7KB bundle, zero cold start. Native `neon-http` driver support. |
| drizzle-kit | 0.31.8 | Migration tooling | `drizzle-kit push` for dev, `drizzle-kit generate` + `migrate` for production. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/font | built-in | Font optimization | Load Inter font with zero layout shift. Self-hosts automatically. |
| zod | 4.3.6 | Schema validation | Validate Server Action inputs from day one. |
| dotenv | latest | Env var loading | Load `.env` / `.env.local` in seed scripts and drizzle config. |
| tsx | latest | TypeScript runner | Execute seed scripts directly: `npx tsx src/db/seed.ts`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npx shadcn create` | `npx create-next-app` + manual shadcn init | More control but ~15 min of manual config that `shadcn create` handles automatically |
| Nova style | Maia style | Maia has generous spacing (more Apple-like whitespace) but Nova's compact layout better fits a data-heavy tracker. Can adjust spacing in CSS variables. |
| `drizzle-kit push` | `drizzle-kit generate` + `migrate` | Migrations are better for production but `push` is faster for initial development. Switch to migrations before Phase 2. |
| Manual seed script | `drizzle-seed` package | `drizzle-seed` generates fake data automatically but we need exact content from the PDF. Manual script gives full control over the 11 weekends of real data. |
| Neon marketplace integration | Manual env vars | Manual setup works but marketplace auto-provisions `DATABASE_URL` and creates preview branches. Saves time and prevents misconfiguration. |

**Installation:**
```bash
# 1. Scaffold project (handles Next.js + Tailwind v4 + shadcn/ui)
npx shadcn@latest create

# 2. Database layer
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# 3. Validation
npm install zod

# 4. Dev dependencies for seed script
npm install -D tsx dotenv
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout: <html>, <body>, Inter font, global CSS
│   ├── page.tsx                # Landing page (renders design system proof)
│   ├── globals.css             # Tailwind imports + design tokens + theme variables
│   └── favicon.ico
├── components/
│   └── ui/                     # shadcn/ui components (added via CLI)
├── lib/
│   ├── db.ts                   # Drizzle + Neon connection singleton
│   └── utils.ts                # cn() utility (created by shadcn)
├── db/
│   ├── schema.ts               # Drizzle schema definitions (4 tables)
│   └── seed.ts                 # Seed script for 11 weekends
├── drizzle.config.ts           # Drizzle Kit configuration
├── .env.local                  # DATABASE_URL (gitignored)
└── .env.example                # Template for env vars (committed)
```

### Pattern 1: Drizzle + Neon HTTP Connection Singleton

**What:** Create a single database connection module that all server-side code imports. Uses the Neon serverless HTTP driver for zero connection pooling concerns.

**When to use:** Every file that needs database access (pages, server actions, seed scripts).

**Example:**
```typescript
// src/lib/db.ts
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-neon (Context7)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

### Pattern 2: Schema Definition with Identity Columns and Relations

**What:** Define normalized tables using `pgTable` with `generatedAlwaysAsIdentity()` for auto-incrementing IDs, foreign key references with cascade deletes, and Drizzle relations for type-safe joins.

**When to use:** The schema file that defines all four tables.

**Example:**
```typescript
// src/db/schema.ts
// Source: https://orm.drizzle.team/docs/sql-schema-declaration (Context7)
import { pgTable, pgEnum, integer, varchar, text,
         boolean, timestamp, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryEnum = pgEnum('category', [
  'foundation',
  'core_projects',
  'automation',
  'system_and_build',
  'bonus',
]);

export const weekends = pgTable('weekends', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  number: integer('number').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  deliverable: text('deliverable').notNull(),
  whyItMatters: text('why_it_matters').notNull(),
  category: categoryEnum('category').notNull(),
  isBonus: boolean('is_bonus').default(false).notNull(),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const weekendsRelations = relations(weekends, ({ many }) => ({
  workItems: many(workItems),
  doneCriteria: many(doneCriteria),
  scorecardRatings: many(scorecardRatings),
}));

export const workItems = pgTable('work_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  isAdvanced: boolean('is_advanced').default(false).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workItemsRelations = relations(workItems, ({ one }) => ({
  weekend: one(weekends, { fields: [workItems.weekendId], references: [weekends.id] }),
}));

export const doneCriteria = pgTable('done_criteria', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  isMet: boolean('is_met').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const doneCriteriaRelations = relations(doneCriteria, ({ one }) => ({
  weekend: one(weekends, { fields: [doneCriteria.weekendId], references: [weekends.id] }),
}));

export const scorecardRatings = pgTable('scorecard_ratings', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer('weekend_id').notNull().references(() => weekends.id, { onDelete: 'cascade' }),
  criterion: varchar('criterion', { length: 255 }).notNull(),
  rating: real('rating'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scorecardRatingsRelations = relations(scorecardRatings, ({ one }) => ({
  weekend: one(weekends, { fields: [scorecardRatings.weekendId], references: [weekends.id] }),
}));
```

### Pattern 3: Drizzle Kit Configuration

**What:** Configure drizzle-kit to point at the schema file and use the Neon connection string.

**When to use:** Required for `drizzle-kit push`, `generate`, and `migrate` commands.

**Example:**
```typescript
// drizzle.config.ts
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-neon (Context7)
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Pattern 4: Manual Seed Script with Sequence Reset

**What:** A seed script that inserts the exact 11 weekends from the PDF with their work items and done criteria, then resets identity sequences to prevent duplicate key conflicts on future inserts.

**When to use:** Run once after schema push to populate the database. Re-run to reset data.

**Example:**
```typescript
// src/db/seed.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { weekends, workItems, doneCriteria } from './schema';

config({ path: '.env.local' });

const client = neon(process.env.DATABASE_URL!);
const db = drizzle({ client });

async function seed() {
  console.log('Seeding database...');

  // Clear existing data (order matters due to foreign keys)
  await db.delete(doneCriteria);
  await db.delete(workItems);
  await db.delete(weekends);

  // Insert weekends (omit id — let generatedAlwaysAsIdentity handle it)
  const [weekend1] = await db.insert(weekends).values({
    number: 1,
    name: 'The Vibe Code Kickoff',
    deliverable: 'Build your resolution tracker',
    whyItMatters: '...content from PDF...',
    category: 'foundation',
    isBonus: false,
  }).returning();

  // Insert work items for weekend 1
  await db.insert(workItems).values([
    { weekendId: weekend1.id, title: 'Work item 1 from PDF', isAdvanced: false, sortOrder: 0 },
    { weekendId: weekend1.id, title: 'Work item 2 from PDF', isAdvanced: false, sortOrder: 1 },
    { weekendId: weekend1.id, title: 'Advanced modifier from PDF', isAdvanced: true, sortOrder: 2 },
  ]);

  // Insert done criteria for weekend 1
  await db.insert(doneCriteria).values([
    { weekendId: weekend1.id, description: 'Done criterion from PDF', sortOrder: 0 },
  ]);

  // ... repeat for all 11 weekends ...

  // CRITICAL: Reset identity sequences after seeding
  // (Known drizzle-seed bug: https://github.com/drizzle-team/drizzle-orm/issues/3915)
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('weekends', 'id'), (SELECT MAX(id) FROM weekends))`);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('work_items', 'id'), (SELECT MAX(id) FROM work_items))`);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('done_criteria', 'id'), (SELECT MAX(id) FROM done_criteria))`);

  console.log('Seeding completed!');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
```

### Pattern 5: Tailwind v4 CSS-First Design Tokens

**What:** Define all design tokens (colors, fonts, spacing, radii) in `globals.css` using CSS variables and the `@theme inline` directive. shadcn/ui generates this structure; customize the values for Apple-minimalist aesthetics.

**When to use:** The single source of truth for the visual design system.

**Example:**
```css
/* src/app/globals.css */
/* Source: https://ui.shadcn.com/docs/installation/manual (Context7) */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Apple-minimalist: zinc base, generous whitespace, subtle borders */
  --background: oklch(1 0 0);           /* Pure white */
  --foreground: oklch(0.145 0 0);       /* Near-black text */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);          /* Deep black for CTAs */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);         /* Light gray */
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0); /* Medium gray for secondary text */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --border: oklch(0.922 0 0);           /* Subtle borders */
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;                   /* 10px — Apple-like rounded corners */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  /* Custom Apple-inspired spacing */
  --font-sans: var(--font-inter);       /* Maps to next/font Inter variable */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

### Pattern 6: Inter Font via next/font in Root Layout

**What:** Load Inter as a variable font using `next/font/google`. Self-hosted automatically by Next.js for zero layout shift and no external network requests.

**When to use:** Root layout.tsx, defined once for the entire application.

**Example:**
```typescript
// src/app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'AI Resolution Tracker',
  description: 'Track your 10-Weekend AI Resolution progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

### Anti-Patterns to Avoid

- **Using `create-next-app` then manually configuring Tailwind + shadcn:** `npx shadcn create` handles all of this in one step. Manual setup risks version mismatches.
- **Using `pg` package or TCP connections:** On Vercel serverless, TCP connections exhaust the connection pool. Use `@neondatabase/serverless` HTTP driver exclusively.
- **Putting `"use client"` on page.tsx:** Phase 1 pages should be 100% Server Components. No client interactivity yet.
- **Using `serial()` instead of `generatedAlwaysAsIdentity()`:** `serial` is deprecated in modern Postgres. Identity columns are the standard.
- **Hardcoding weekend data in components:** All content must live in the database. The seed script is the single source of truth.
- **Using `drizzle-seed` package for real content:** `drizzle-seed` generates fake data. We have specific content from the PDF that must be seeded manually.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project scaffolding | Manual Next.js + Tailwind + shadcn setup | `npx shadcn create` with Nova style | Handles all config, version compatibility, and file structure in one command |
| Database connection | Custom connection pooling | `@neondatabase/serverless` HTTP driver | Purpose-built for serverless; handles connection lifecycle automatically |
| Schema migrations | Manual SQL files | `drizzle-kit push` (dev) / `drizzle-kit generate` + `migrate` (prod) | Type-safe, tracks changes, generates SQL automatically |
| CSS theming | Custom CSS framework | shadcn/ui CSS variables + `@theme inline` | Comprehensive system covering all UI states, dark mode ready |
| Font loading | Google Fonts `<link>` tag | `next/font/google` Inter | Self-hosted, zero layout shift, preloaded, privacy-preserving |
| Environment variables | `.env` with custom loader | Vercel env vars + `.env.local` + `dotenv` in scripts | Auto-provisioned via Neon marketplace, scoped per environment |
| Component styling | Custom Tailwind component classes | shadcn/ui components via `npx shadcn add` | Accessible (ARIA), consistent, pre-built variants |

**Key insight:** Phase 1 is foundation work -- every tool should be a well-trodden path, not a custom solution. The entire stack (shadcn + Drizzle + Neon + Vercel) has official integration guides and starter templates.

## Common Pitfalls

### Pitfall 1: Identity Column Sequence Not Resetting After Seed

**What goes wrong:** After running the seed script, any subsequent `INSERT` (from Server Actions in later phases) fails with `duplicate key value violates unique constraint` because the Postgres identity sequence was never incremented during manual inserts.
**Why it happens:** When you insert rows with explicit values into a `generatedAlwaysAsIdentity` column (which `drizzle-seed` does internally), the underlying Postgres sequence is not advanced. Known bug: [drizzle-orm#3915](https://github.com/drizzle-team/drizzle-orm/issues/3915).
**How to avoid:** After all seed inserts, execute `SELECT setval(pg_get_serial_sequence('table_name', 'id'), (SELECT MAX(id) FROM table_name))` for every table. Include this in the seed script as a final step.
**Warning signs:** `NeonDbError: duplicate key value violates unique constraint` on the first Server Action mutation after deployment.

### Pitfall 2: Missing `DATABASE_URL` in Different Environments

**What goes wrong:** App works locally but crashes on Vercel with `TypeError: Cannot read properties of undefined` because `process.env.DATABASE_URL` is `undefined`.
**Why it happens:** `.env.local` only works locally. Vercel needs env vars set in the dashboard or via the Neon marketplace integration. Developers forget to set them for all three scopes (Production, Preview, Development).
**How to avoid:** Use the Neon marketplace integration on Vercel -- it auto-provisions `DATABASE_URL` for all environments. Verify after setup by checking Vercel project settings. Use `vercel env pull` to sync to local `.env.local`.
**Warning signs:** Build succeeds but runtime errors mention undefined connection strings.

### Pitfall 3: Running `drizzle-kit push` Against Production

**What goes wrong:** `push` applies schema changes directly without migration files. If you push a destructive change (drop column, rename table), data is lost with no rollback.
**Why it happens:** `push` is convenient and developers use it out of habit even after leaving the development phase.
**How to avoid:** Use `drizzle-kit push` only during initial development (Phase 1). Switch to `drizzle-kit generate` + `drizzle-kit migrate` before Phase 2. Add `"db:push": "drizzle-kit push"` and `"db:migrate": "drizzle-kit migrate"` as separate npm scripts to make the distinction clear.
**Warning signs:** Running `push` against a database with real user data.

### Pitfall 4: Forgetting `export const dynamic = 'force-dynamic'` on Data Pages

**What goes wrong:** Pages that query the database are statically rendered at build time and never refresh. The landing page shows stale data forever.
**Why it happens:** Next.js App Router statically renders pages by default when there are no dynamic functions. Server Component database queries using the Neon driver may not signal to Next.js that the page is dynamic.
**How to avoid:** Add `export const dynamic = 'force-dynamic'` to any page that fetches data from the database. Alternatively, use `unstable_noStore()` before database calls. In Phase 1, the landing page should be dynamic to prove database connectivity.
**Warning signs:** Data changes in the database but the deployed page shows old content until redeployment.

### Pitfall 5: shadcn/ui Style Mismatch with Tailwind v4

**What goes wrong:** Components render with broken styles because the `@theme inline` mapping was not generated or was incorrectly configured.
**Why it happens:** Manual setup can miss the bridge between CSS variables (`:root { --primary: ... }`) and Tailwind utilities (`bg-primary`). The `@theme inline` block maps CSS variables to Tailwind's color system.
**How to avoid:** Use `npx shadcn create` which generates the correct `globals.css` with both `:root` variables and `@theme inline` mappings. If customizing, always keep both in sync.
**Warning signs:** `bg-primary` renders as transparent. Tailwind classes reference colors that do not exist.

### Pitfall 6: Committing `.env.local` with Database Credentials

**What goes wrong:** Database connection string with username and password is committed to the git repository. Anyone with repo access can modify your database.
**Why it happens:** `.env.local` is gitignored by default in `create-next-app`, but developers sometimes override `.gitignore` or create `.env` (without `.local`) which IS committed by default.
**How to avoid:** Verify `.gitignore` includes `.env*.local`. Create `.env.example` with placeholder values (no real credentials). Never use `NEXT_PUBLIC_` prefix for database URLs.
**Warning signs:** `git status` shows `.env.local` as a tracked file. The database URL appears in the repository.

## Code Examples

Verified patterns from official sources:

### Scaffolding a New Project

```bash
# Source: https://ui.shadcn.com/docs/installation (Context7)
# Run the interactive CLI
npx shadcn@latest create

# When prompted, select:
# - Framework: Next.js
# - Style: Nova (compact, reduced padding)
# - Base color: Zinc (neutral, Apple-like)
# - Component library: Radix
# - Icons: Lucide
```

### Adding shadcn/ui Components

```bash
# Source: https://ui.shadcn.com/docs/cli (Context7)
# Add individual components as needed
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add progress
```

### Pushing Schema to Neon

```bash
# Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-neon (Context7)
# First time: push schema directly (development only)
npx drizzle-kit push

# Run seed script
npx tsx src/db/seed.ts
```

### Verifying Database Connection in a Server Component

```typescript
// src/app/page.tsx (Phase 1 landing page)
// Source: https://neon.com/docs/guides/nextjs
import { db } from '@/lib/db';
import { weekends } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allWeekends = await db.select().from(weekends).orderBy(weekends.number);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        AI Resolution Tracker
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        10 weekends. Real AI skills. Track your progress.
      </p>
      <div className="mt-12 space-y-4">
        {allWeekends.map((w) => (
          <div
            key={w.id}
            className="rounded-lg border border-border bg-card p-6"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Weekend {w.number}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{w.name}</h2>
            <p className="mt-2 text-muted-foreground">{w.deliverable}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
```

### Deploying to Vercel

```bash
# Option A: Connect GitHub repo via Vercel dashboard (recommended)
# 1. Go to vercel.com, click "Add New Project"
# 2. Import your GitHub repository
# 3. Add Neon integration from Vercel Marketplace (auto-sets DATABASE_URL)
# 4. Deploy

# Option B: CLI deploy
npm install -g vercel
vercel          # Preview deployment
vercel --prod   # Production deployment
```

### Syncing Vercel Env Vars Locally

```bash
# After Neon marketplace integration is set up on Vercel:
vercel env pull .env.local
# This downloads DATABASE_URL and other vars to your local .env.local
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-first config with `@theme` directive | Tailwind v4 (Jan 2025) | No JS config file needed. Design tokens defined in CSS. |
| Individual `@radix-ui/react-*` packages | Unified `radix-ui` package | Radix 1.4.x (2025) | Single install, simpler dependency management |
| `create-next-app` + `npx shadcn init` | `npx shadcn create` | Dec 2025 | One command scaffolds everything with style presets |
| `serial()` in Drizzle | `integer().generatedAlwaysAsIdentity()` | Drizzle 0.32.0 | Follows Postgres identity column standard |
| Vercel Postgres (managed by Vercel) | Neon via Vercel Marketplace | Q4 2024 - Q1 2025 | Vercel transitioned all Postgres to Neon's native integration |
| `@next/font` package | `next/font` (built-in) | Next.js 13.2+ | No separate package install needed |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Still works but CSS-first with `@theme` is the v4 standard
- `@next/font`: Replaced by built-in `next/font`. Do not install in new projects.
- Vercel Postgres store: Transitioned to Neon. Use Neon marketplace integration instead.
- `serial()` in Drizzle: Use `integer().generatedAlwaysAsIdentity()` instead

## Open Questions

Things that could not be fully resolved:

1. **Exact `shadcn create` interactive prompts and defaults**
   - What we know: The CLI asks for framework, style, base color, component library, icons, and fonts. Nova style and zinc base color are the recommended choices.
   - What's unclear: The exact sequence of prompts may vary by version, and whether it auto-detects an existing Git repo or creates a new directory.
   - Recommendation: Run the CLI interactively and select options manually. If it creates a new directory, move files into the existing repo. Document the exact prompts encountered for reproducibility.

2. **Whether `drizzle-kit push` works with `generatedAlwaysAsIdentity` on Neon**
   - What we know: `drizzle-kit push` is documented to work with Neon. Identity columns are supported in Drizzle 0.32.0+.
   - What's unclear: Whether Neon's serverless endpoint handles the `GENERATED ALWAYS AS IDENTITY` DDL without issues.
   - Recommendation: Test `push` early. If it fails, fall back to `drizzle-kit generate` + `drizzle-kit migrate` from the start.

3. **Neon marketplace integration behavior with preview branches**
   - What we know: The integration auto-provisions `DATABASE_URL` and can create a separate database branch per preview deployment.
   - What's unclear: Whether the preview branch is seeded automatically or starts empty.
   - Recommendation: For Phase 1, focus on the production branch only. Preview branch seeding can be addressed if needed in later phases.

## Sources

### Primary (HIGH confidence)
- Context7: `/llmstxt/orm_drizzle_team_llms_txt` -- Schema definition, Neon HTTP driver setup, drizzle-kit commands, relations API
- Context7: `/vercel/next.js` -- Project creation, App Router setup, environment variables, font optimization
- Context7: `/websites/ui_shadcn` -- `npx shadcn create`, components.json config, CSS variables theming, Tailwind v4 integration
- Context7: `/tailwindlabs/tailwindcss.com` -- `@theme` directive, CSS-first configuration, design token patterns
- [Drizzle + Neon Tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) -- Official end-to-end setup guide
- [Neon + Next.js Guide](https://neon.com/docs/guides/nextjs) -- Server Components and Server Actions with Neon
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation) -- CLI-based scaffolding
- [shadcn/create Changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create) -- Nova style, five visual styles
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) -- `next/font` setup
- [Drizzle Seed Overview](https://orm.drizzle.team/docs/seed-overview) -- `drizzle-seed` package usage

### Secondary (MEDIUM confidence)
- [Vercel Neon Marketplace Integration](https://vercel.com/marketplace/neon) -- Auto-provisioning of DATABASE_URL
- [Neon Managed Vercel Integration Docs](https://neon.com/docs/guides/neon-managed-vercel-integration) -- Environment variable scoping
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) -- Scoping, limits, `vercel env pull`
- [Next.js 16 Google Fonts Setup](https://www.buildwithmatija.com/blog/nextjs-16-google-fonts-inter-exo-2) -- Inter + CSS variable pattern
- [drizzle-orm Issue #3915](https://github.com/drizzle-team/drizzle-orm/issues/3915) -- Identity sequence bug in drizzle-seed
- [shadcn/ui Design Principles](https://gist.github.com/eonist/fc3ae41d70d38af42db462015fece5a2) -- Minimalist aesthetic philosophy

### Tertiary (LOW confidence)
- [Seeding Neon Database with Drizzle in Next.js](https://javascript.plainenglish.io/seeding-neon-database-with-drizzle-in-nextjs-7992dff2f8db) -- Community seed script patterns
- [Fonts in Next.js Architecture Guide 2026](https://thelinuxcode.com/fonts-in-nextjs-a-practical-architecture-guide-for-2026/) -- Font strategy recommendations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm and Context7. Official integration guides exist for the exact combination (Neon + Drizzle + Next.js + shadcn/ui + Vercel).
- Architecture: HIGH -- Project structure follows official Next.js App Router conventions. Schema design validated against Drizzle documentation. Connection pattern from Neon's official Next.js guide.
- Pitfalls: HIGH -- Identity sequence bug confirmed via GitHub issue with reproduction. Environment variable issues confirmed via Vercel docs. All other pitfalls from official sources.
- Scaffolding: HIGH -- `npx shadcn create` documented in official shadcn/ui changelog (Dec 2025). Nova style and five visual styles confirmed.
- Seed script: MEDIUM -- Manual seed pattern is well-established but the exact `setval` approach for `generatedAlwaysAsIdentity` columns relies on community workaround (not yet fixed in drizzle-seed).

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days -- stable ecosystem, no major releases expected)

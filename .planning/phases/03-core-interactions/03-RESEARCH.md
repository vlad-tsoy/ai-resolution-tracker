# Phase 3: Core Interactions - Research

**Researched:** 2026-02-07
**Domain:** Server Actions for mutations, optimistic checkbox toggling, debounced auto-save notes, markdown rendering
**Confidence:** HIGH

## Summary

Phase 3 transforms the read-only detail view (from Phase 2) into an interactive CRUD loop. The four capabilities are: (1) checkbox toggling of individual work items via Server Actions with optimistic UI, (2) automatic weekend completion status derived from work item state, (3) a free-text notes field per weekend that auto-saves with debouncing, and (4) basic markdown rendering for notes. This is the phase where Client Components (`"use client"`) become necessary -- Server Components handle data fetching, but interaction (click, type, debounce) requires client-side JavaScript.

The technical domain is well-established. React 19's `useOptimistic` hook provides first-class support for optimistic checkbox toggling. Drizzle ORM has a documented `not()` operator for boolean field toggling. The auto-save pattern uses a debounced callback (either via `use-debounce` library or a custom hook of about 15 lines) that calls a Server Action after a configurable delay. For markdown, the simplest approach for this personal tool is a plain `<textarea>` for editing with `react-markdown` for rendering -- no heavy WYSIWYG editor needed. The `revalidatePath` function ensures the overview page's progress bar and status badges stay in sync after mutations.

**Primary recommendation:** Use `useOptimistic` + `useTransition` for instant checkbox feedback, a custom debounce hook (no new dependency) calling a `saveNotes` Server Action, shadcn/ui `Checkbox` component for the toggle UI, a plain shadcn/ui `Textarea` for notes input, and `react-markdown` (v9+) for rendering saved notes. The detail page (`/weekend/[id]`) must exist first (a Phase 2 dependency) before Phase 3 can wire in interactivity.

## Standard Stack

Phase 3 uses the stack from Phases 1-2 and adds minimal new packages.

### Core (Already Installed)
| Library | Version | Purpose | Phase 3 Usage |
|---------|---------|---------|---------------|
| Next.js | 16.1.6 | Full-stack framework | Server Actions for mutations, `revalidatePath` for cache invalidation |
| React | 19.2.3 | UI library | `useOptimistic`, `useTransition`, `useState` for interactive components |
| Drizzle ORM | 0.45.x | Type-safe ORM | `update().set().where()` for toggling booleans, updating text |
| @neondatabase/serverless | 1.0.2 | DB driver | HTTP connection for mutations |
| Tailwind CSS | 4.x | Styling | Interactive state styles (checked, saving indicator) |
| shadcn/ui | latest | Component system | Checkbox, Textarea components |
| zod | 4.3.6 | Validation | Validate Server Action inputs |

### New (To Install)
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| react-markdown | 9.x | Render markdown to React elements | Display formatted notes in read/preview mode. Safe by default (renders to React elements, not raw HTML). React 19 compatible in v9+. |

### Not Needed for Phase 3
| Library | Reason |
|---------|--------|
| @uiw/react-md-editor | Overkill for a personal notes field. A plain textarea + react-markdown preview is simpler, lighter, and sufficient. |
| MDXEditor | WYSIWYG is unnecessary -- the user writes markdown directly. |
| use-debounce | A 15-line custom hook is sufficient. No need for an external dependency for a single debounce use case. |
| lodash | Avoid pulling in lodash for a single `debounce` function. |
| next-safe-action | Adds typed server action wrappers. Unnecessary for a single-user app with 3 simple actions. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain textarea + react-markdown | @uiw/react-md-editor | Full editor with toolbar/preview is heavier (~4.6KB gzipped) but provides better UX for markdown novices. For a personal tool where the user knows markdown, the textarea approach is simpler and has zero bundle impact from the editor. |
| Custom debounce hook | `use-debounce` package | The package provides `cancel`, `flush`, `isPending` for free. But for a single auto-save use case, 15 lines of custom code avoids a dependency. |
| `useOptimistic` | Simple `useState` with `startTransition` | `useOptimistic` auto-reverts on failure. `useState` requires manual revert logic. `useOptimistic` is the correct tool for this pattern. |
| `revalidatePath` on both `/` and `/weekend/[id]` | `revalidateTag` with tagged fetch | `revalidatePath` is simpler for this app size. Tagged revalidation is more granular but adds complexity without benefit for 11 weekends. |

**Installation:**
```bash
npm install react-markdown

# shadcn/ui components needed (if not already installed)
npx shadcn@latest add checkbox
npx shadcn@latest add textarea
```

## Architecture Patterns

### Recommended Project Structure (Phase 3 Additions)

```
src/
├── app/
│   └── (dashboard)/
│       ├── page.tsx                      # Overview (existing, no changes needed)
│       └── weekend/
│           └── [id]/
│               └── page.tsx              # Detail page (must exist from Phase 2)
├── components/
│   ├── ui/
│   │   ├── checkbox.tsx                  # NEW: shadcn/ui Checkbox
│   │   └── textarea.tsx                  # NEW: shadcn/ui Textarea
│   └── weekend/
│       ├── work-item-list.tsx            # NEW: Interactive checklist (Client Component)
│       ├── work-item-row.tsx             # NEW: Single checkbox row with optimistic toggle
│       └── notes-editor.tsx              # NEW: Auto-saving textarea with markdown preview
├── lib/
│   ├── actions.ts                        # NEW: Server Actions (toggle, save notes)
│   └── hooks/
│       └── use-debounce.ts              # NEW: Custom debounce hook
```

### Pattern 1: Server Action for Toggling a Work Item

**What:** A Server Action that toggles the `isCompleted` boolean on a work item, then checks if all core items for that weekend are now complete and updates the weekend's `completedAt` accordingly. Uses `revalidatePath` to refresh both the detail page and the overview page.

**When to use:** Every checkbox click on a work item.

**Confidence:** HIGH -- Drizzle `not()` operator verified via Context7, Server Actions verified via Next.js docs

**Example:**
```typescript
// src/lib/actions.ts
'use server';

import { db } from '@/lib/db';
import { workItems, weekends } from '@/db/schema';
import { eq, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleWorkItem(itemId: number) {
  // 1. Toggle the boolean in a single SQL statement
  const [updated] = await db
    .update(workItems)
    .set({
      isCompleted: not(workItems.isCompleted),
      updatedAt: new Date(),
    })
    .where(eq(workItems.id, itemId))
    .returning();

  if (!updated) return;

  // 2. Check if all core work items for this weekend are now completed
  const allItems = await db.query.workItems.findMany({
    where: eq(workItems.weekendId, updated.weekendId),
  });
  const coreItems = allItems.filter((item) => !item.isAdvanced);
  const allCoreCompleted =
    coreItems.length > 0 && coreItems.every((item) => item.isCompleted);

  // 3. Update weekend completedAt based on core item status
  await db
    .update(weekends)
    .set({
      completedAt: allCoreCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, updated.weekendId));

  // 4. Revalidate both pages
  revalidatePath('/');
  revalidatePath(`/weekend/${updated.weekendId}`);
}
```

### Pattern 2: Optimistic Checkbox with `useOptimistic`

**What:** A Client Component that immediately toggles the checkbox visually using `useOptimistic`, then calls the Server Action in a `useTransition`. If the Server Action fails, React automatically reverts the optimistic state. The checkbox responds instantly (~0ms) while the DB update happens in the background (~100-300ms).

**When to use:** Every interactive checkbox in the work item list.

**Confidence:** HIGH -- `useOptimistic` is a stable React 19 hook, verified via React docs and Next.js examples

**Example:**
```typescript
// src/components/weekend/work-item-row.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleWorkItem } from '@/lib/actions';

type WorkItemRowProps = {
  id: number;
  title: string;
  isCompleted: boolean;
  isAdvanced: boolean;
};

export function WorkItemRow({ id, title, isCompleted, isAdvanced }: WorkItemRowProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(isCompleted);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleWorkItem(id);
    });
  }

  return (
    <label
      className={`flex items-start gap-3 py-2 cursor-pointer ${
        isPending ? 'opacity-70' : ''
      }`}
    >
      <Checkbox
        checked={optimisticCompleted}
        onCheckedChange={handleToggle}
        className="mt-0.5"
      />
      <span
        className={
          optimisticCompleted
            ? 'line-through text-muted-foreground'
            : isAdvanced
              ? 'text-muted-foreground'
              : ''
        }
      >
        {title}
      </span>
    </label>
  );
}
```

### Pattern 3: Debounced Auto-Save for Notes

**What:** A Client Component with a textarea that stores content in local state. On every change, a debounced function is called that invokes a Server Action to persist the notes. A subtle "saving..." / "saved" indicator provides feedback. No explicit save button.

**When to use:** The notes field on the weekend detail page.

**Confidence:** HIGH -- standard React pattern, verified via multiple sources

**Example:**
```typescript
// src/lib/hooks/use-debounce.ts
import { useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}
```

```typescript
// src/components/weekend/notes-editor.tsx
'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { saveNotes } from '@/lib/actions';
import { useDebouncedCallback } from '@/lib/hooks/use-debounce';

type NotesEditorProps = {
  weekendId: number;
  initialNotes: string | null;
};

export function NotesEditor({ weekendId, initialNotes }: NotesEditorProps) {
  const [value, setValue] = useState(initialNotes ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debouncedSave = useDebouncedCallback(
    useCallback(
      async (text: string) => {
        setSaveStatus('saving');
        await saveNotes(weekendId, text);
        setSaveStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      },
      [weekendId]
    ),
    1000 // 1 second debounce
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    setSaveStatus('idle');
    debouncedSave(newValue);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`notes-${weekendId}`}
          className="text-sm font-medium"
        >
          Notes
        </label>
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
        </span>
      </div>
      <Textarea
        id={`notes-${weekendId}`}
        value={value}
        onChange={handleChange}
        placeholder="Reflections, links, learnings... (markdown supported)"
        rows={6}
        className="resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Supports markdown formatting
      </p>
    </div>
  );
}
```

### Pattern 4: Server Action for Saving Notes

**What:** A Server Action that accepts a weekend ID and notes text, validates with zod, and persists to the database. Revalidates the detail page path.

**When to use:** Called by the debounced auto-save in NotesEditor.

**Confidence:** HIGH

**Example:**
```typescript
// Addition to src/lib/actions.ts
import { z } from 'zod';

const saveNotesSchema = z.object({
  weekendId: z.number().int().positive(),
  notes: z.string().max(50000), // reasonable limit
});

export async function saveNotes(weekendId: number, notes: string) {
  const parsed = saveNotesSchema.parse({ weekendId, notes });

  await db
    .update(weekends)
    .set({
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, parsed.weekendId));

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
```

### Pattern 5: Markdown Rendering for Notes

**What:** Use `react-markdown` to render stored notes as formatted content. The notes field shows a live preview below the textarea while editing. This uses the same `value` state and the same `react-markdown` component, adding zero complexity.

**When to use:** Displaying saved notes in the detail view.

**Confidence:** HIGH -- react-markdown v9+ is verified to work with React 19

**Example:**
```typescript
// In notes-editor.tsx, after the textarea:
import Markdown from 'react-markdown';

// Within the component JSX:
{value && (
  <div className="mt-4 p-4 rounded-lg bg-muted/50">
    <Markdown
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="mt-2 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mt-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mt-2 space-y-1">{children}</ol>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground mt-2">
            {children}
          </blockquote>
        ),
      }}
    >
      {value}
    </Markdown>
  </div>
)}
```

**Note:** Using `react-markdown`'s `components` prop avoids needing `@tailwindcss/typography`. Each element gets targeted Tailwind classes that match the zinc-based Apple-minimalist design system.

### Pattern 6: Weekend Auto-Completion (DETAIL-03)

**What:** The weekend's completion status is derived, not stored as a separate field. The `completedAt` timestamp is set/cleared by the `toggleWorkItem` Server Action whenever it detects all core items are done. The overview page reads this state from the database on each render.

**When to use:** Built into the `toggleWorkItem` Server Action (Pattern 1). No separate UI action needed.

**Confidence:** HIGH -- this is a data derivation, not a new technology

**Logic:**
```
When a work item is toggled:
  1. Toggle the item's isCompleted in DB
  2. Fetch all work items for that weekend
  3. Filter to core items only (isAdvanced === false)
  4. If ALL core items are completed -> set weekend.completedAt = now()
  5. If ANY core item is NOT completed -> set weekend.completedAt = null
  6. Revalidate overview page (progress bar + status badges update)
```

The overview page already computes completion status from work items (see `src/app/(dashboard)/page.tsx` lines 14-18 and `weekend-card.tsx` `deriveStatus` function). The `completedAt` timestamp adds an explicit server-side signal, but the UI derives from work item state.

### Anti-Patterns to Avoid

- **Client-side state for work item completion:** Do NOT store checkbox state in `useState` and try to sync it with the server. Use `useOptimistic` which automatically reverts on failure and settles to server truth.

- **Saving notes on every keystroke:** Do NOT call the Server Action on every `onChange`. This would create 5-10 requests per second while typing. Always debounce (1 second is a good default).

- **Full page reloads after mutations:** Do NOT use `router.refresh()` or `window.location.reload()`. Use `revalidatePath` in the Server Action -- Next.js handles the incremental update.

- **WYSIWYG editor for personal notes:** Do NOT install a heavy rich-text editor like TipTap, Slate, or ProseMirror. The user writes markdown in a textarea. `react-markdown` renders it. This is a personal tool, not a publishing platform.

- **Storing derived status as a column:** Do NOT add a `status` enum column to `weekends` that must be kept in sync with work item state. Derive it at read time or set `completedAt` as a byproduct of the toggle action. The current `deriveStatus` function in `weekend-card.tsx` is the correct pattern.

- **Using `useActionState` for checkbox toggle:** `useActionState` is designed for form submissions with validation errors and pending states. For a simple boolean toggle, `useOptimistic` + `useTransition` is the correct and simpler pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox UI with accessibility | Custom `<input type="checkbox">` with ARIA | shadcn/ui `<Checkbox>` (Radix primitive) | Handles focus management, keyboard navigation, ARIA attributes, indeterminate state |
| Debounce for auto-save | Complex timer management with cleanup | Custom `useDebouncedCallback` hook (15 lines) | Encapsulates `clearTimeout`/`setTimeout`, handles cleanup, type-safe |
| Markdown rendering | Raw HTML string injection or custom parser | `react-markdown` v9 | Safe (renders to React elements, not raw HTML), supports plugins (GFM), React 19 compatible |
| Textarea component | Plain `<textarea>` with manual styling | shadcn/ui `<Textarea>` | Consistent styling, auto-resize, focus ring, themed to match design system |
| Optimistic UI for toggles | Manual `useState` + try/catch + rollback | React 19 `useOptimistic` | Automatic revert on failure, works inside transitions, first-class React pattern |
| Cache invalidation | Manual router.refresh() or fetch revalidation | `revalidatePath` in Server Actions | Next.js handles granular re-rendering, no full page reload |

**Key insight:** Phase 3 is about wiring interactive components to Server Actions. The "hard parts" (optimistic UI, debouncing, markdown rendering, accessible checkboxes) all have established solutions. The implementation work is composing them correctly within the existing page structure.

## Common Pitfalls

### Pitfall 1: Race Condition on Rapid Checkbox Toggling

**What goes wrong:** User rapidly clicks a checkbox multiple times. The optimistic state flickers, and the final DB state may not match what the user sees because Server Actions arrive out of order.

**Why it happens:** Each click fires a separate `toggleWorkItem` Server Action. If request A (check) arrives after request B (uncheck), the item ends up checked even though the user's last action was to uncheck.

**How to avoid:** The `not()` operator in Drizzle makes the toggle server-side atomic -- it always inverts the current DB value, so ordering does not matter. Combined with `useOptimistic` inside a `useTransition`, React serializes the transitions and settles to the final server state when all transitions complete.

**Warning signs:** Checkbox state flickering or not matching the final DB state after rapid clicks. Test by clicking 5+ times quickly.

### Pitfall 2: Debounce Not Firing on Unmount

**What goes wrong:** User types notes, then immediately navigates away. The debounced save never fires because the component unmounts before the timeout completes.

**Why it happens:** `setTimeout` is cleared when the component unmounts (if using a cleanup in `useEffect`), or the timer just never fires because the component is gone.

**How to avoid:** Two strategies: (1) Use `flush()` on unmount via a `useEffect` cleanup function that calls the pending debounce immediately. (2) Accept the data loss for the last < 1 second of typing -- for a personal tool, this is a reasonable tradeoff. If using the `use-debounce` library, its `useDebouncedCallback` exposes a `.flush()` method for this. A custom hook can expose similar functionality.

**Warning signs:** Notes appear "lost" when navigating away from the detail page right after typing.

### Pitfall 3: Stale Props After Server Action

**What goes wrong:** After toggling a work item, the notes editor or other components on the same page still show stale data because `revalidatePath` only revalidates at the route level.

**Why it happens:** `revalidatePath` triggers a re-render of the page's Server Component, which fetches fresh data and streams new HTML to the client. But Client Components that received props at initial render do not automatically re-render with new props unless the parent Server Component passes new ones.

**How to avoid:** This is actually handled correctly by Next.js -- when `revalidatePath` fires, the Server Component re-renders with fresh DB data, and React reconciles the diff. Client Components receive updated props because their parent re-renders. The key is that Client Components must accept props from the Server Component parent (not fetch data themselves). The `initialNotes` prop pattern in the notes editor is correct.

**Warning signs:** UI not updating after a mutation. Usually indicates the component is fetching its own data client-side rather than receiving props.

### Pitfall 4: Missing Detail Page Route

**What goes wrong:** Phase 3 work items assume a detail page exists at `/weekend/[id]`, but if Phase 2 did not create this route, there is nowhere to render the interactive components.

**Why it happens:** Phase 2 built the overview page but may not have completed the detail page route. The current codebase has a `getWeekendById` query function but no `weekend/[id]/page.tsx` file.

**How to avoid:** Phase 3 must create the detail page route if it does not exist. This is a prerequisite for all Phase 3 work. The page is a Server Component that fetches the weekend and passes data to Client Components (work-item-list, notes-editor).

**Warning signs:** 404 when clicking a weekend card on the overview page.

### Pitfall 5: Checkbox and Textarea Not Working in Server Components

**What goes wrong:** Adding a `<Checkbox>` or `<Textarea>` inside a Server Component results in "Event handlers cannot be passed to Client Component props" or similar errors.

**Why it happens:** Interactive elements (onClick, onChange, onCheckedChange) require client-side JavaScript. They must be in Client Components marked with `"use client"`.

**How to avoid:** The detail page (`page.tsx`) remains a Server Component that fetches data. Interactive sections are split into Client Component children:
```
page.tsx (Server Component - fetches data)
  |-- WorkItemList (Client Component - checkboxes)
  |-- NotesEditor (Client Component - textarea + save)
```

**Warning signs:** TypeScript errors about event handler props, or runtime errors about hooks in Server Components.

### Pitfall 6: Markdown Rendering Style Mismatch

**What goes wrong:** The `prose` classes used to style `react-markdown` output produce no visible styling, or the rendered markdown has default styles that clash with the Apple-minimalist design.

**Why it happens:** The `prose` utility classes require `@tailwindcss/typography` to be installed and configured. Without it, `prose` is a no-op class. Even with the plugin, its default styles may not match the zinc-based color palette.

**How to avoid:** Use `react-markdown`'s `components` prop to apply targeted Tailwind classes to each element type (h1, h2, p, ul, a, code, blockquote). This avoids a dependency on `@tailwindcss/typography` and gives full control over styling to match the design system.

**Warning signs:** Markdown renders as unstyled text, or styled text with colors/fonts that do not match the rest of the app.

## Code Examples

### Example 1: Complete Server Actions File

```typescript
// src/lib/actions.ts
'use server';

import { db } from '@/lib/db';
import { workItems, weekends } from '@/db/schema';
import { eq, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Toggle Work Item ---

export async function toggleWorkItem(itemId: number) {
  // Validate input
  const id = z.number().int().positive().parse(itemId);

  // Toggle in a single atomic SQL operation
  const [updated] = await db
    .update(workItems)
    .set({
      isCompleted: not(workItems.isCompleted),
      updatedAt: new Date(),
    })
    .where(eq(workItems.id, id))
    .returning();

  if (!updated) return;

  // Derive weekend completion from core items
  const allItems = await db.query.workItems.findMany({
    where: eq(workItems.weekendId, updated.weekendId),
  });
  const coreItems = allItems.filter((item) => !item.isAdvanced);
  const allCoreCompleted =
    coreItems.length > 0 && coreItems.every((item) => item.isCompleted);

  await db
    .update(weekends)
    .set({
      completedAt: allCoreCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, updated.weekendId));

  revalidatePath('/');
  revalidatePath(`/weekend/${updated.weekendId}`);
}

// --- Save Notes ---

const saveNotesSchema = z.object({
  weekendId: z.number().int().positive(),
  notes: z.string().max(50000),
});

export async function saveNotes(weekendId: number, notes: string) {
  const parsed = saveNotesSchema.parse({ weekendId, notes });

  await db
    .update(weekends)
    .set({
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, parsed.weekendId));

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
```

### Example 2: Detail Page (Server Component)

```typescript
// src/app/(dashboard)/weekend/[id]/page.tsx
import { getWeekendById } from '@/lib/queries';
import { WorkItemList } from '@/components/weekend/work-item-list';
import { NotesEditor } from '@/components/weekend/notes-editor';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WeekendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const weekendId = parseInt(id);
  if (isNaN(weekendId)) notFound();

  const weekend = await getWeekendById(weekendId);
  if (!weekend) notFound();

  const coreItems = weekend.workItems.filter((w) => !w.isAdvanced);
  const advancedItems = weekend.workItems.filter((w) => w.isAdvanced);

  return (
    <article className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to overview
      </Link>

      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Weekend {weekend.number}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {weekend.name}
        </h1>
        <p className="text-muted-foreground">{weekend.deliverable}</p>
      </header>

      {/* Core Work Items - interactive checkboxes */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Core Work</h2>
        <WorkItemList items={coreItems} />
      </section>

      {/* Advanced Modifiers - interactive checkboxes */}
      {advancedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Advanced Modifiers
            <Badge variant="outline">Optional</Badge>
          </h2>
          <WorkItemList items={advancedItems} />
        </section>
      )}

      {/* Done Criteria - read only */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Done When</h2>
        <ul className="space-y-2">
          {weekend.doneCriteria.map((criterion) => (
            <li key={criterion.id} className="text-muted-foreground text-sm">
              {criterion.description}
            </li>
          ))}
        </ul>
      </section>

      {/* Notes - auto-saving editor */}
      <NotesEditor weekendId={weekend.id} initialNotes={weekend.notes} />
    </article>
  );
}
```

### Example 3: Work Item List (Client Component Wrapper)

```typescript
// src/components/weekend/work-item-list.tsx
'use client';

import { WorkItemRow } from './work-item-row';

type WorkItem = {
  id: number;
  title: string;
  isCompleted: boolean;
  isAdvanced: boolean;
};

type WorkItemListProps = {
  items: WorkItem[];
};

export function WorkItemList({ items }: WorkItemListProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <WorkItemRow key={item.id} {...item} />
      ))}
    </div>
  );
}
```

### Example 4: Custom Debounce Hook

```typescript
// src/lib/hooks/use-debounce.ts
import { useRef, useCallback, useEffect } from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref current without re-creating the debounced function
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + manual rollback for optimistic UI | `useOptimistic` hook (React 19) | React 19 (2024) | Auto-reverts on failure, works inside transitions |
| `useFormState` for form mutations | `useActionState` (React 19) | React 19 (2024) | Renamed, more general API, works with `startTransition` |
| API routes (`/api/toggle`) for mutations | Server Actions (`'use server'`) | Next.js 14+ (stable) | Direct function calls, no HTTP boilerplate, type-safe |
| `router.refresh()` for cache invalidation | `revalidatePath()` in Server Actions | Next.js 14+ | Granular path-level invalidation, no full page refresh |
| External debounce library (lodash) | Custom hook or `use-debounce` package | 2024+ | React hooks ecosystem makes custom debounce trivial |
| `react-markdown@8.x` | `react-markdown@9.x` | 2024 | ESM-only, React 19 compatible, new MarkdownAsync export |

**Deprecated/outdated:**
- `useFormState`: Renamed to `useActionState` in React 19. Same functionality, different name.
- `react-markdown@8.x`: Has TypeScript compatibility issues with React 19's JSX types. Upgrade to v9+.
- `router.refresh()` for post-mutation updates: Still works but `revalidatePath` is more precise and the recommended pattern.

## Codebase-Specific Findings

### What Already Exists (from Phase 1 and Phase 2)

1. **Database schema** (`src/db/schema.ts`): `workItems` table has `isCompleted` boolean. `weekends` table has `notes` text column. Both have `updatedAt` timestamps. Relations are defined. All ready for Phase 3.

2. **Query functions** (`src/lib/queries.ts`): `getWeekendById(id)` already fetches a weekend with work items and done criteria. Ready for the detail page.

3. **Overview page** (`src/app/(dashboard)/page.tsx`): Already derives completion from work items (`coreItems.every(item => item.isCompleted)`). Will automatically reflect changes after `revalidatePath('/')`.

4. **Weekend card** (`src/components/weekend/weekend-card.tsx`): Has `deriveStatus()` function that computes `completed`/`in_progress`/`not_started` from work items. Links to `/weekend/${weekend.id}`.

5. **shadcn/ui components installed**: Card, Badge, Progress, Skeleton. Checkbox and Textarea need to be added.

### What Does NOT Exist Yet

1. **Detail page route** (`src/app/(dashboard)/weekend/[id]/page.tsx`): Not created. This is a **prerequisite** for all Phase 3 interactive features. The overview page links to `/weekend/${weekend.id}` but this route does not exist.

2. **Server Actions file** (`src/lib/actions.ts`): Not created. Needs `toggleWorkItem` and `saveNotes`.

3. **Client Components for interaction**: No `work-item-list.tsx`, `work-item-row.tsx`, or `notes-editor.tsx`.

4. **shadcn/ui Checkbox and Textarea**: Not installed yet.

5. **`react-markdown` package**: Not installed.

### Phase 2 Dependency Gap

The detail page route is the critical gap. Phase 3 requirements (DETAIL-02, DETAIL-03, NOTES-01, NOTES-02, NOTES-03) all depend on a detail view existing. The overview page and its components are complete, but clicking a weekend card currently leads to a 404. Phase 3 planning must account for this -- either as a prerequisite task or integrated into the first work item.

## Open Questions

1. **Should the notes editor show a live markdown preview, or just render on save?**
   - What we know: The requirement says "support basic formatting (markdown or rich text)." A live preview (below the textarea) makes markdown formatting visible as you type. Rendering only on save means you type raw markdown and see the result after navigating away and back.
   - Recommendation: Show a live preview below the textarea while editing. It uses the same `react-markdown` component and the same `value` state, adding zero complexity. This is the standard pattern for markdown editors and makes the formatting support visible and useful.

2. **Should advanced work items have checkboxes too, or only core items?**
   - What we know: The requirement (DETAIL-02) says "checkboxes for individual core work items." Advanced modifiers are optional extras.
   - Recommendation: Give all work items (core AND advanced) checkboxes. The `isAdvanced` flag determines whether they count toward weekend completion, but the user should still be able to track whether they did the advanced work. The `toggleWorkItem` action already handles this -- the auto-completion logic only considers core items.

3. **Should `@tailwindcss/typography` be installed for markdown styling?**
   - What we know: The `prose` classes need this plugin. Without it, markdown renders unstyled.
   - Recommendation: Do NOT install `@tailwindcss/typography`. Instead, use `react-markdown`'s `components` prop to apply targeted Tailwind classes. This avoids a dependency, gives full control, and ensures markdown output matches the zinc-based Apple-minimalist design rather than the typography plugin's default (opinionated) styles.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js` -- Server Actions, `revalidatePath`, `useOptimistic`, `useActionState`, `useTransition`, `startTransition`
- Context7 `/websites/orm_drizzle_team` -- `update().set()`, `not()` for boolean toggle, `eq()` filter, `.returning()`
- Context7 `/websites/ui_shadcn` -- Checkbox with `checked`/`onCheckedChange`, Textarea component, Field component
- [React Docs: useOptimistic](https://react.dev/reference/react/useOptimistic) -- Hook API, transition integration, auto-revert behavior
- [Next.js Docs: Updating Data (Server Actions)](https://nextjs.org/docs/app/getting-started/updating-data) -- Server Action patterns, revalidation
- [Drizzle ORM: Toggling a Boolean Field](https://orm.drizzle.team/docs/guides/toggling-a-boolean-field) -- `not()` operator with `update().set()`
- [Drizzle ORM: Drizzle with Neon](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) -- Update patterns with neon-http driver

### Secondary (MEDIUM confidence)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- React 19 compatibility in v9+, `MarkdownAsync`/`MarkdownHooks` exports
- [react-markdown Issue #920](https://github.com/remarkjs/react-markdown/issues/920) -- React 19 TypeScript type fix in v9
- [FreeCodeCamp: Optimistic UI with useOptimistic](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) -- Pattern walkthrough
- [MakerKit: Next.js Server Actions Complete Guide 2026](https://makerkit.dev/blog/tutorials/nextjs-server-actions) -- Best practices, debounce patterns
- [Colum Kelly: useOptimistic Won't Save You](https://www.columkelly.com/blog/use-optimistic) -- Race condition analysis and mitigations
- [use-debounce GitHub](https://github.com/xnimorz/use-debounce) -- Standalone debounce hook library reference
- [Frontend Masters: Autosaving Entries](https://frontendmasters.com/courses/fullstack-app-next-v3/autosaving-entries/) -- Auto-save pattern with Server Actions

### Tertiary (LOW confidence)
- [Strapi: 5 Best Markdown Editors for React](https://strapi.io/blog/top-5-markdown-editors-for-react) -- Editor comparison for awareness
- [Next.js GitHub Discussion #63564](https://github.com/vercel/next.js/discussions/63564) -- useOptimistic dev mode issue (informational)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries are either already installed or well-documented (react-markdown v9 is widely used with React 19).
- Architecture patterns: HIGH -- Server Actions, useOptimistic, debounced auto-save are documented first-class patterns in Next.js 16 / React 19. Verified via Context7.
- Pitfalls: HIGH -- Race condition mitigation via atomic `not()` toggle verified in Drizzle docs. Debounce unmount edge case is a known React pattern. Stale props after revalidation is well-understood in Next.js.
- Code examples: HIGH -- All patterns sourced from Context7 (official docs) and verified against actual project schema and component structure.
- Codebase integration: HIGH -- All existing files reviewed. Phase 2 dependency gap (missing detail page) identified and documented.

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving concerns)

# Phase 4: Weekly Scorecard - Research

**Researched:** 2026-02-07
**Domain:** Scorecard rating UI (1-5 scale + Yes/No), auto-saving Server Actions, Drizzle upsert, schema modification
**Confidence:** HIGH

## Summary

Phase 4 adds a scorecard section to the weekend detail page that appears only for completed weekends. The scorecard has four rating dimensions (Outcome Quality 1-5, Time Saved 1-5, Repeatability 1-5, Use Again Yes/No) plus a free-text notes field. All inputs auto-save on change -- the 1-5 scale and Yes/No toggle save immediately on click (no debounce needed), while the notes field uses the same debounced auto-save pattern established in Phase 3.

The existing `scorecardRatings` table stores one row per dimension per weekend with columns: `weekendId`, `criterion` (varchar), `rating` (real), and `comment` (text). However, the table is MISSING a unique constraint on `(weekendId, criterion)`, which is required for Drizzle's `onConflictDoUpdate` upsert pattern to work. This constraint must be added via schema change + `drizzle-kit push`. For SCORE-05 (scorecard notes), the existing `weekends.notes` column is already used by Phase 3 for general weekend notes. Scorecard-specific notes need a new `scorecardNotes` column on the `weekends` table, or can be stored using the `comment` field on one of the scorecard rating rows. The cleanest approach is adding a `scorecardNotes` text column to the `weekends` table since it is a single free-text field per weekend, not per-dimension.

The UI approach uses shadcn/ui `ToggleGroup` (type="single") for the 1-5 scale ratings and shadcn/ui `Switch` for the Yes/No toggle. These are already-established Radix UI primitives with built-in accessibility. No external star rating library is needed -- a `ToggleGroup` with 5 items ("1" through "5") is simpler, more accessible, and matches the Apple-minimalist design better than star icons. The scorecard section renders conditionally based on whether all core work items are completed (the `completedAt` field set by Phase 3's `toggleWorkItem` action).

**Primary recommendation:** Add a unique constraint on `scorecardRatings(weekendId, criterion)` and a `scorecardNotes` text column on `weekends`, then use `onConflictDoUpdate` upserts for instant-save ratings. Use shadcn/ui `ToggleGroup` (type="single") for 1-5 ratings, `Switch` for Yes/No, and the same debounced textarea pattern from Phase 3 for scorecard notes. Wrap everything in a `ScorecardSection` Client Component that conditionally renders based on weekend completion status.

## Standard Stack

Phase 4 uses the Phase 1-3 stack and adds minimal new shadcn/ui components. No new npm packages are needed.

### Core (Already Installed)
| Library | Version | Purpose | Phase 4 Usage |
|---------|---------|---------|---------------|
| Next.js | 16.1.6 | Full-stack framework | Server Actions for rating upserts, `revalidatePath` |
| React | 19.2.3 | UI library | `useState`, `useTransition`, `useOptimistic` for interactive rating controls |
| Drizzle ORM | 0.45.x | Type-safe ORM | `insert().onConflictDoUpdate()` for upserts, `update().set()` for notes |
| @neondatabase/serverless | 1.0.2 | DB driver | HTTP connection for mutations |
| Tailwind CSS | 4.x | Styling | Rating control styling, conditional visibility |
| shadcn/ui | latest | Component system | ToggleGroup, Switch, Textarea, Label (new additions) |
| zod | 4.3.6 | Validation | Validate Server Action inputs (rating values, dimension names) |
| lucide-react | 0.563.0 | Icons | Lock icon for disabled scorecard state |

### New shadcn/ui Components (To Add)
| Component | Purpose | Why Needed |
|-----------|---------|------------|
| ToggleGroup | 1-5 scale rating selector | Single-select group of 5 items. Built on Radix `ToggleGroup` with accessibility. `type="single"` + `onValueChange` gives click-to-rate behavior. |
| Switch | Yes/No toggle for "Use Again" | Binary toggle with built-in accessibility. Simpler and more visually appropriate than a checkbox for Yes/No. |
| Label | Accessible labels for rating dimensions | Associates label text with form controls for screen readers. |

### Not Needed for Phase 4
| Library | Reason |
|---------|--------|
| react-simple-star-rating | ToggleGroup with 5 numbered items is cleaner, more accessible, and matches the minimal design. Star icons add visual noise. |
| @smastrom/react-rating | Same reasoning. The 1-5 scale is better served by a button group than star icons for this use case. |
| react-hook-form | No forms here -- each rating control auto-saves independently on click. Form management adds unnecessary complexity. |
| use-debounce | The custom `useDebouncedCallback` hook from Phase 3 already exists at `src/lib/hooks/use-debounce.ts`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ToggleGroup for 1-5 | Star rating component | Stars are visually familiar but harder to style minimally. ToggleGroup items ("1" "2" "3" "4" "5") are cleaner, more accessible, and map directly to the data model. |
| Switch for Yes/No | Checkbox or ToggleGroup with 2 items | Switch is the standard UI for binary toggles. Checkbox implies a checklist item. ToggleGroup with 2 items works but is visually heavier. |
| New `scorecardNotes` column on `weekends` | Separate `scorecard_notes` table | A single text column is far simpler than a new table for one field per weekend. The `weekends` table already has a `notes` column (Phase 3), so `scorecardNotes` is the natural parallel. |
| Upsert (`onConflictDoUpdate`) | Select-then-insert-or-update | Upsert is atomic, handles the "first rating" and "update rating" cases in one query, and is more efficient. |

**Installation:**
```bash
# shadcn/ui components (ToggleGroup, Switch, Label)
npx shadcn@latest add toggle-group --yes
npx shadcn@latest add switch --yes
npx shadcn@latest add label --yes
```

Note: `react-markdown` (for scorecard notes preview) is already installed from Phase 3.

## Architecture Patterns

### Recommended Project Structure (Phase 4 Additions)

```
src/
├── db/
│   └── schema.ts                       # MODIFIED: Add unique constraint + scorecardNotes column
├── app/
│   └── (dashboard)/
│       └── weekend/
│           └── [id]/
│               └── page.tsx            # MODIFIED: Pass scorecard data to detail component
├── components/
│   ├── ui/
│   │   ├── toggle-group.tsx            # NEW: shadcn/ui ToggleGroup
│   │   ├── switch.tsx                  # NEW: shadcn/ui Switch
│   │   └── label.tsx                   # NEW: shadcn/ui Label
│   └── weekend/
│       ├── weekend-detail.tsx          # MODIFIED: Add ScorecardSection
│       ├── scorecard-section.tsx       # NEW: Client Component - scorecard container
│       ├── rating-scale.tsx            # NEW: Client Component - 1-5 ToggleGroup rating
│       └── use-again-toggle.tsx        # NEW: Client Component - Yes/No Switch
├── lib/
│   ├── actions.ts                      # MODIFIED: Add saveRating, saveScorecardNotes
│   └── queries.ts                      # MODIFIED: Include scorecardRatings in getWeekendById
```

### Pattern 1: Schema Modification for Upsert Support

**What:** Add a composite unique constraint on `scorecardRatings(weekendId, criterion)` so that `onConflictDoUpdate` can target it. Add a `scorecardNotes` text column to `weekends` for SCORE-05.

**When to use:** Before any scorecard functionality can work -- this is a prerequisite.

**Confidence:** HIGH -- Drizzle unique constraints and `drizzle-kit push` verified via Context7

**Example:**
```typescript
// src/db/schema.ts - Modified scorecardRatings table
import { unique } from "drizzle-orm/pg-core";

export const scorecardRatings = pgTable("scorecard_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer("weekend_id")
    .notNull()
    .references(() => weekends.id, { onDelete: "cascade" }),
  criterion: varchar("criterion", { length: 255 }).notNull(),
  rating: real("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => [
  unique("scorecard_ratings_weekend_criterion").on(t.weekendId, t.criterion),
]);

// weekends table - Add scorecardNotes column
export const weekends = pgTable("weekends", {
  // ... existing columns ...
  scorecardNotes: text("scorecard_notes"),  // NEW: Phase 4 scorecard notes
});
```

Then run `drizzle-kit push` to apply the changes to Neon.

### Pattern 2: Upsert Server Action for Rating

**What:** A Server Action that upserts a scorecard rating. If no row exists for this (weekendId, criterion) pair, it inserts one. If a row already exists, it updates the rating value. Uses Drizzle's `onConflictDoUpdate` with the composite unique constraint as the conflict target.

**When to use:** Every time a user clicks a rating value (1-5 scale or Yes/No toggle).

**Confidence:** HIGH -- Drizzle `onConflictDoUpdate` with composite targets verified via Context7

**Example:**
```typescript
// Addition to src/lib/actions.ts
import { scorecardRatings } from '@/db/schema';

const saveRatingSchema = z.object({
  weekendId: z.number().int().positive(),
  criterion: z.enum(['outcome_quality', 'time_saved', 'repeatability', 'use_again']),
  rating: z.number().min(0).max(5),
});

export async function saveRating(weekendId: number, criterion: string, rating: number) {
  const parsed = saveRatingSchema.parse({ weekendId, criterion, rating });

  await db
    .insert(scorecardRatings)
    .values({
      weekendId: parsed.weekendId,
      criterion: parsed.criterion,
      rating: parsed.rating,
    })
    .onConflictDoUpdate({
      target: [scorecardRatings.weekendId, scorecardRatings.criterion],
      set: {
        rating: parsed.rating,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
```

### Pattern 3: ToggleGroup for 1-5 Scale Rating

**What:** A Client Component that renders a shadcn/ui `ToggleGroup` with type="single" containing 5 items. The user clicks a number to rate. The value is immediately sent to the server via a Server Action (no debounce needed for click events). `useOptimistic` provides instant visual feedback.

**When to use:** For the three 1-5 scale dimensions (Outcome Quality, Time Saved, Repeatability).

**Confidence:** HIGH -- shadcn/ui ToggleGroup verified via Context7, Radix UI docs confirm controlled mode

**Example:**
```typescript
// src/components/weekend/rating-scale.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { saveRating } from '@/lib/actions';

type RatingScaleProps = {
  weekendId: number;
  criterion: string;
  label: string;
  description?: string;
  currentValue: number | null;
};

export function RatingScale({
  weekendId,
  criterion,
  label,
  description,
  currentValue,
}: RatingScaleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleValueChange(value: string) {
    if (!value) return; // Prevent deselection
    const numValue = parseInt(value);
    startTransition(async () => {
      setOptimisticValue(numValue);
      await saveRating(weekendId, criterion, numValue);
    });
  }

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <ToggleGroup
        type="single"
        value={optimisticValue?.toString() ?? ''}
        onValueChange={handleValueChange}
        className={isPending ? 'opacity-70' : ''}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <ToggleGroupItem
            key={n}
            value={n.toString()}
            aria-label={`${label}: ${n} out of 5`}
            className="w-10 h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
```

### Pattern 4: Switch for Yes/No Toggle

**What:** A Client Component that renders a shadcn/ui `Switch` for the "Use Again" dimension. Clicking the switch immediately saves the value (1 for Yes, 0 for No) via the same `saveRating` Server Action.

**When to use:** For the "Use Again" Yes/No dimension (SCORE-04).

**Confidence:** HIGH -- shadcn/ui Switch verified via Context7

**Example:**
```typescript
// src/components/weekend/use-again-toggle.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { saveRating } from '@/lib/actions';

type UseAgainToggleProps = {
  weekendId: number;
  currentValue: number | null; // 1 = Yes, 0 = No, null = unset
};

export function UseAgainToggle({ weekendId, currentValue }: UseAgainToggleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    const numValue = checked ? 1 : 0;
    startTransition(async () => {
      setOptimisticValue(numValue);
      await saveRating(weekendId, 'use_again', numValue);
    });
  }

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="use-again" className="text-sm font-medium">
        Use Again?
      </Label>
      <div className={`flex items-center gap-2 ${isPending ? 'opacity-70' : ''}`}>
        <span className="text-xs text-muted-foreground">
          {optimisticValue === 1 ? 'Yes' : optimisticValue === 0 ? 'No' : ''}
        </span>
        <Switch
          id="use-again"
          checked={optimisticValue === 1}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}
```

### Pattern 5: Scorecard Notes (Debounced Auto-Save)

**What:** A textarea for free-text scorecard notes (SCORE-05) using the same debounced auto-save pattern from Phase 3's `NotesEditor`. Stored in the new `weekends.scorecardNotes` column.

**When to use:** The "Notes" section within the scorecard.

**Confidence:** HIGH -- exact same pattern as Phase 3, verified and implemented

**Example:**
```typescript
// A new Server Action in src/lib/actions.ts
const saveScorecardNotesSchema = z.object({
  weekendId: z.number().int().positive(),
  notes: z.string().max(50000),
});

export async function saveScorecardNotes(weekendId: number, notes: string) {
  const parsed = saveScorecardNotesSchema.parse({ weekendId, notes });

  await db
    .update(weekends)
    .set({
      scorecardNotes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, parsed.weekendId));

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
```

The UI component follows the same structure as `NotesEditor` from Phase 3 -- a `Textarea` with `useDebouncedCallback` calling `saveScorecardNotes`, and a "Saving..." / "Saved" status indicator.

### Pattern 6: Conditional Scorecard Rendering

**What:** The scorecard section only appears on completed weekends. Completion is determined by checking `weekend.completedAt` (set by Phase 3's `toggleWorkItem` action). For uncompleted weekends, either hide the section entirely or show a locked/disabled placeholder.

**When to use:** In the `WeekendDetail` component when deciding whether to render `ScorecardSection`.

**Confidence:** HIGH -- straightforward conditional rendering based on existing data

**Example:**
```typescript
// In weekend-detail.tsx
const isCompleted = weekend.completedAt !== null;

// Option A: Hide entirely
{isCompleted && (
  <ScorecardSection weekend={weekend} />
)}

// Option B: Show locked state (better UX -- user knows it exists)
{isCompleted ? (
  <ScorecardSection weekend={weekend} />
) : (
  <section className="space-y-3 opacity-50">
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight">Scorecard</h2>
      <Lock className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">
      Complete all core work items to unlock the scorecard.
    </p>
  </section>
)}
```

**Recommendation:** Option B (locked state) is better UX. It tells the user the scorecard exists and what they need to do to unlock it, which creates motivation to complete the work items.

### Pattern 7: Query Layer Update

**What:** The `getWeekendById` query must be updated to include `scorecardRatings` in its relational query, so the detail page has access to existing ratings.

**When to use:** In `src/lib/queries.ts`.

**Confidence:** HIGH -- same relational query pattern already used for `workItems` and `doneCriteria`

**Example:**
```typescript
// src/lib/queries.ts - Updated getWeekendById
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
      scorecardRatings: true, // NEW: Include all scorecard ratings
    },
  });
}
```

### Anti-Patterns to Avoid

- **Separate API call per dimension on page load:** Do NOT fetch each rating dimension individually. The relational query (`with: { scorecardRatings: true }`) fetches all ratings for a weekend in a single query. Transform into a lookup map in the component.

- **Debouncing click-based ratings:** Do NOT debounce the 1-5 scale or Yes/No toggle saves. Unlike text input (where the user types continuously), a click is a discrete action. Save immediately on click -- the user expects instant feedback.

- **Storing "Use Again" as a boolean column:** Do NOT add a boolean column for this. Store it as a row in `scorecardRatings` with criterion='use_again' and rating=1 (yes) or 0 (no). This keeps the data model uniform.

- **Using RadioGroup instead of ToggleGroup for 1-5:** `RadioGroup` requires separate `RadioGroupItem` elements with different visual styling. `ToggleGroup` with `type="single"` gives the same single-select behavior but with a more compact, button-group visual that fits the minimal design.

- **Showing scorecard for in-progress weekends:** The requirement states "uncompleted weekends do not show the scorecard (or show it as locked/disabled)." Enforce this strictly -- a user should not be able to rate a weekend they have not finished.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 1-5 scale selector | Custom button group with state management | shadcn/ui `ToggleGroup` type="single" | Built-in accessibility (ARIA), keyboard navigation, focus management, controlled/uncontrolled modes |
| Yes/No toggle | Custom checkbox with "Yes"/"No" labels | shadcn/ui `Switch` | Semantic toggle control, built-in ARIA, consistent with design system |
| Accessible form labels | Manual `<label>` elements with `htmlFor` | shadcn/ui `Label` | Consistent styling, Radix-based accessibility |
| Upsert logic | Manual SELECT + conditional INSERT/UPDATE | Drizzle `onConflictDoUpdate` | Atomic, single query, handles both cases, verified pattern |
| Debounced auto-save | New debounce implementation | Phase 3's `useDebouncedCallback` hook | Already exists at `src/lib/hooks/use-debounce.ts`, tested and working |
| Rating data lookup | Array.find in every component | Transform to Record/Map once in parent | O(1) lookup vs O(n) per dimension, cleaner component props |

**Key insight:** Phase 4 is primarily a UI composition exercise. The mutation patterns (Server Actions, upserts, auto-save) are established from Phase 3. The new work is (1) a schema modification for the unique constraint, (2) new shadcn/ui components for the rating inputs, and (3) a conditional rendering wrapper for completion gating.

## Common Pitfalls

### Pitfall 1: Missing Unique Constraint Breaks Upsert

**What goes wrong:** `onConflictDoUpdate` with `target: [scorecardRatings.weekendId, scorecardRatings.criterion]` fails with a database error because there is no corresponding unique constraint.

**Why it happens:** The `scorecardRatings` table was created in Phase 1 without a composite unique constraint on `(weekendId, criterion)`. Drizzle's upsert requires a unique constraint or unique index that matches the conflict target.

**How to avoid:** Add the unique constraint to the schema definition AND run `drizzle-kit push` before implementing any scorecard save logic. This is the very first task in the phase.

**Warning signs:** Database error: "there is no unique or exclusion constraint matching the ON CONFLICT specification."

### Pitfall 2: ToggleGroup Deselection on Re-Click

**What goes wrong:** User clicks the already-selected rating value and it deselects, leaving the rating empty.

**Why it happens:** By default, Radix `ToggleGroup` with `type="single"` allows deselection. When the user clicks the active item, `onValueChange` receives an empty string `""`.

**How to avoid:** Guard the `onValueChange` handler with `if (!value) return;`. This prevents deselection -- once a rating is set, the user can change it but not clear it.

**Warning signs:** Rating values disappearing when clicking the same number twice.

### Pitfall 3: Stale Scorecard Data After Work Item Toggle

**What goes wrong:** User completes the last core work item (weekend becomes completed), but the scorecard section does not appear until they refresh the page.

**Why it happens:** The `toggleWorkItem` Server Action calls `revalidatePath`, which re-renders the page. But the `completedAt` field is updated AFTER the work item toggle, and the page may not reflect the new completion state immediately.

**How to avoid:** This should work correctly because `revalidatePath` triggers a full page re-render from the Server Component, which re-fetches `getWeekendById` with the updated `completedAt`. The key is that `toggleWorkItem` already sets `completedAt` and calls `revalidatePath` for the detail page. Test by toggling the last core work item and verifying the scorecard appears.

**Warning signs:** Scorecard not appearing after completing all core items. Check that `revalidatePath` is called AFTER the `completedAt` update in the Server Action.

### Pitfall 4: TypeScript Type Mismatch After Schema Change

**What goes wrong:** The `WeekendDetail` type (derived from `getWeekendById` return type) does not include `scorecardRatings` or `scorecardNotes`, causing type errors in components.

**Why it happens:** The type is derived from the query return type. If the query is updated to include `scorecardRatings` but the components are not updated to expect the new shape, TypeScript will catch the mismatch.

**How to avoid:** Update the query FIRST, then update components. The derived type pattern (`NonNullable<Awaited<ReturnType<typeof getWeekendById>>>`) will automatically include the new data once the query is updated.

**Warning signs:** TypeScript errors about missing properties on the weekend object.

### Pitfall 5: Rating Value Type Confusion (real vs integer)

**What goes wrong:** The `rating` column is defined as `real` (floating point) in the schema, but ratings are always integers 0-5.

**Why it happens:** Phase 1 defined the column as `real` for future flexibility (half-star ratings, weighted averages, etc.).

**How to avoid:** Always store integer values (0, 1, 2, 3, 4, 5). Use `z.number().int().min(0).max(5)` in the zod schema to enforce this. When reading, the value may come back as a float (e.g., `3.0`), so use `Math.round()` or compare with `===` carefully. For the "Use Again" dimension, store 1 (yes) or 0 (no).

**Warning signs:** ToggleGroup not highlighting the correct item because `3.0 !== 3` in string comparison. Convert to integer before converting to string for the ToggleGroup value.

### Pitfall 6: Scorecard Notes vs Weekend Notes Confusion

**What goes wrong:** Scorecard notes are saved to the wrong column (`weekends.notes` instead of `weekends.scorecardNotes`), overwriting the user's general weekend notes.

**Why it happens:** Both are text fields on the same table. The Phase 3 `saveNotes` action writes to `notes`. The Phase 4 `saveScorecardNotes` action must write to `scorecardNotes`.

**How to avoid:** Use distinct Server Actions with distinct column names. Name them clearly: `saveNotes` (Phase 3, general notes) vs `saveScorecardNotes` (Phase 4, scorecard notes). Verify the column name in the Drizzle `set` clause.

**Warning signs:** General notes disappearing or changing when editing scorecard notes (or vice versa).

## Code Examples

### Example 1: ScorecardSection Container Component

```typescript
// src/components/weekend/scorecard-section.tsx
'use client';

import { RatingScale } from './rating-scale';
import { UseAgainToggle } from './use-again-toggle';
import { ScorecardNotesEditor } from './scorecard-notes-editor';

type ScorecardRating = {
  id: number;
  criterion: string;
  rating: number | null;
  comment: string | null;
};

type ScorecardSectionProps = {
  weekendId: number;
  ratings: ScorecardRating[];
  scorecardNotes: string | null;
};

export function ScorecardSection({
  weekendId,
  ratings,
  scorecardNotes,
}: ScorecardSectionProps) {
  // Build a lookup map for O(1) access by criterion
  const ratingMap = new Map(
    ratings.map((r) => [r.criterion, r.rating])
  );

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Scorecard</h2>

      <div className="space-y-5">
        <RatingScale
          weekendId={weekendId}
          criterion="outcome_quality"
          label="Outcome Quality"
          description="How good was the final result?"
          currentValue={ratingMap.get('outcome_quality') ?? null}
        />
        <RatingScale
          weekendId={weekendId}
          criterion="time_saved"
          label="Time Saved"
          description="How much time did AI save you?"
          currentValue={ratingMap.get('time_saved') ?? null}
        />
        <RatingScale
          weekendId={weekendId}
          criterion="repeatability"
          label="Repeatability"
          description="Could you reproduce this approach?"
          currentValue={ratingMap.get('repeatability') ?? null}
        />

        <UseAgainToggle
          weekendId={weekendId}
          currentValue={ratingMap.get('use_again') ?? null}
        />
      </div>

      <ScorecardNotesEditor
        weekendId={weekendId}
        initialNotes={scorecardNotes}
      />
    </section>
  );
}
```

### Example 2: Complete saveRating Server Action with Upsert

```typescript
// Addition to src/lib/actions.ts
const VALID_CRITERIA = ['outcome_quality', 'time_saved', 'repeatability', 'use_again'] as const;

const saveRatingSchema = z.object({
  weekendId: z.number().int().positive(),
  criterion: z.enum(VALID_CRITERIA),
  rating: z.number().int().min(0).max(5),
});

export async function saveRating(weekendId: number, criterion: string, rating: number) {
  const parsed = saveRatingSchema.parse({ weekendId, criterion, rating });

  await db
    .insert(scorecardRatings)
    .values({
      weekendId: parsed.weekendId,
      criterion: parsed.criterion,
      rating: parsed.rating,
    })
    .onConflictDoUpdate({
      target: [scorecardRatings.weekendId, scorecardRatings.criterion],
      set: {
        rating: parsed.rating,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
```

### Example 3: Schema Modification

```typescript
// src/db/schema.ts - Modified sections

// Add import for unique
import { unique } from "drizzle-orm/pg-core";

// Modified weekends table - add scorecardNotes column
export const weekends = pgTable("weekends", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  number: integer("number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  deliverable: text("deliverable").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  category: categoryEnum("category").notNull(),
  isBonus: boolean("is_bonus").default(false).notNull(),
  notes: text("notes"),
  scorecardNotes: text("scorecard_notes"),  // NEW
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Modified scorecardRatings table - add unique constraint
export const scorecardRatings = pgTable("scorecard_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer("weekend_id")
    .notNull()
    .references(() => weekends.id, { onDelete: "cascade" }),
  criterion: varchar("criterion", { length: 255 }).notNull(),
  rating: real("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => [
  unique("scorecard_ratings_weekend_criterion").on(t.weekendId, t.criterion),
]);
```

Then push:
```bash
npx drizzle-kit push
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Star rating icon libraries (react-stars, etc.) | ToggleGroup / button groups | 2024+ | Better accessibility, simpler styling, no icon dependency |
| Separate INSERT/UPDATE logic for ratings | `onConflictDoUpdate` upsert | Drizzle ORM 0.30+ (stable) | Atomic, single query, cleaner code |
| Form submission for ratings | Server Actions with immediate invocation | Next.js 14+ (stable) | No form wrapper needed, direct function call on click |
| Manual ARIA attributes for rating controls | Radix UI primitives (ToggleGroup, Switch) | 2023+ | Built-in accessibility, keyboard navigation, focus management |
| Client-side state + periodic sync | `useOptimistic` + Server Action per interaction | React 19 (2024) | Instant feedback, auto-revert on failure, server truth |

**Deprecated/outdated:**
- Star rating libraries that require jQuery or vanilla JS -- use React-native solutions or shadcn/ui primitives
- `useFormState` -- renamed to `useActionState` in React 19 (but neither is needed here; `useOptimistic` + `useTransition` is the correct pattern for discrete click actions)

## Codebase-Specific Findings

### What Already Exists

1. **`scorecardRatings` table** (`src/db/schema.ts`): Exists with correct columns (`weekendId`, `criterion`, `rating`, `comment`, timestamps). Relations defined to `weekends`. Missing: composite unique constraint on `(weekendId, criterion)`.

2. **`weekends.notes` column**: Exists, used by Phase 3 for general notes. Scorecard needs a separate `scorecardNotes` column.

3. **`weekends.completedAt` column**: Exists, set/cleared by Phase 3's `toggleWorkItem` action. This is the gating signal for showing the scorecard.

4. **Server Actions pattern** (`src/lib/actions.ts`, from Phase 3): `toggleWorkItem` and `saveNotes` already exist. Phase 4 adds `saveRating` and `saveScorecardNotes` following the same pattern.

5. **Debounce hook** (`src/lib/hooks/use-debounce.ts`): Exists from Phase 3. Reused for scorecard notes auto-save.

6. **shadcn/ui Checkbox and Textarea**: Already installed from Phase 3. ToggleGroup, Switch, and Label need to be added.

7. **`react-markdown`**: Already installed (v10.1.0) from Phase 3. Can be reused for scorecard notes preview.

8. **Relational query in `getWeekendById`**: Already fetches `workItems` and `doneCriteria`. Needs `scorecardRatings: true` added.

9. **`WeekendDetail` type derivation**: `NonNullable<Awaited<ReturnType<typeof getWeekendById>>>` pattern ensures type safety. Adding `scorecardRatings` to the query automatically updates the type.

### What Does NOT Exist Yet

1. **Composite unique constraint** on `scorecardRatings(weekendId, criterion)` -- must be added before upserts work
2. **`scorecardNotes` column** on `weekends` table -- must be added for SCORE-05
3. **shadcn/ui ToggleGroup, Switch, Label** components -- not yet installed
4. **`saveRating` Server Action** -- new upsert action
5. **`saveScorecardNotes` Server Action** -- new notes save action
6. **Scorecard UI components** -- `ScorecardSection`, `RatingScale`, `UseAgainToggle`, scorecard notes editor

### Phase 3 Dependency

Phase 4 depends on Phase 3 being complete because:
1. `completedAt` must be set by the `toggleWorkItem` action (completion gating)
2. The Server Actions file (`src/lib/actions.ts`) and debounce hook must exist
3. The detail page must have the interactive component architecture (Server Component parent + Client Component children)

If Phase 3 has not been executed yet, Phase 4 planning must account for these dependencies or Phase 3 must be executed first.

## Open Questions

1. **Should the scorecard notes editor have a markdown preview like the general notes editor?**
   - What we know: Phase 3's `NotesEditor` includes a live markdown preview via `react-markdown`. The scorecard notes field (SCORE-05) is for "best prompt, approach, what didn't work" -- shorter, more structured feedback.
   - Recommendation: YES, include markdown preview for consistency. Reuse the same `react-markdown` component and styled components from Phase 3. The user may want to format prompts as code blocks.

2. **What label text should each rating dimension use?**
   - What we know: The requirements specify dimension names (Outcome Quality, Time Saved, Repeatability, Use Again) but not descriptive labels.
   - Recommendation: Use short descriptive labels with helper text:
     - "Outcome Quality" -- "How good was the final result?"
     - "Time Saved" -- "How much time did AI save you?"
     - "Repeatability" -- "Could you reproduce this approach?"
     - "Use Again?" -- "Would you use this AI approach again?"

3. **Should the scorecard allow clearing a rating (resetting to unset)?**
   - What we know: The ToggleGroup deselection guard (`if (!value) return`) prevents clearing. The Switch always has a state (on/off).
   - Recommendation: Do NOT allow clearing once set. Ratings are evaluative -- if the user wants to change their mind, they change the value, not clear it. This simplifies the UI and data model.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/orm_drizzle_team` -- `onConflictDoUpdate` with composite targets, unique constraints in PostgreSQL, update/insert patterns
- Context7 `/websites/ui_shadcn` -- ToggleGroup (type="single" with controlled value/onValueChange), Switch component, Label component, CLI installation commands
- [Drizzle ORM: Upsert guide](https://orm.drizzle.team/docs/guides/upsert) -- Composite key upsert with `onConflictDoUpdate`
- [Drizzle ORM: Indexes and Constraints](https://orm.drizzle.team/docs/indexes-constraints) -- PostgreSQL unique constraint syntax
- [Radix UI: Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group) -- Controlled single-select mode, deselection behavior

### Secondary (MEDIUM confidence)
- [shadcn/ui Toggle Group docs](https://ui.shadcn.com/docs/components/radix/toggle-group) -- Outline variant, single/multiple modes
- [Next.js Server Actions: Complete Guide (MakerKit 2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions) -- Server Action patterns, immediate invocation
- [shadcn/ui GitHub Issue #2516](https://github.com/shadcn-ui/ui/issues/2516) -- ToggleGroup value handling patterns
- [shadcn.io Rating Button](https://www.shadcn.io/button/rating) -- Community star rating component for reference (not used, but shows the `role="radiogroup"` pattern)

### Tertiary (LOW confidence)
- [shadcn/ui GitHub Issue #1107](https://github.com/shadcn-ui/ui/issues/1107) -- Community request for native rating component (informational)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All components are existing shadcn/ui primitives or already-installed libraries. No new npm dependencies.
- Architecture patterns: HIGH -- Upsert pattern verified via Context7 Drizzle docs. ToggleGroup controlled mode verified via Context7 shadcn/ui docs and Radix UI docs. Auto-save pattern is identical to Phase 3.
- Schema changes: HIGH -- Drizzle unique constraint syntax verified via Context7. `drizzle-kit push` workflow established in Phase 1.
- Pitfalls: HIGH -- ToggleGroup deselection guard verified via Radix UI docs. Upsert constraint requirement verified via Drizzle docs. Type derivation pattern established in Phase 2.
- Code examples: HIGH -- All patterns sourced from Context7 and adapted to actual project schema and component structure.

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving concerns)

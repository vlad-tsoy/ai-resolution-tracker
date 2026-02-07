# Phase 5: Suggestion Engine & Polish - Research

**Researched:** 2026-02-07
**Domain:** Recommendation logic, animation/motion, celebration UX
**Confidence:** HIGH

## Summary

Phase 5 combines two distinct concerns: (1) a suggestion engine that recommends which weekend to tackle next based on completion state and category dependency order, and (2) visual polish via animations using the Motion library. The suggestion engine is purely algorithmic -- a rule-based function operating on the existing data model with no ML or external services required. The animation work uses Motion 12.x (formerly Framer Motion), which is already identified in the project's stack but not yet installed.

The research found that Motion 12.x works well with Next.js App Router via the `"use client"` directive or the `motion/react-client` import path. For celebration effects, `canvas-confetti` is the ecosystem standard (1.4M+ weekly downloads, zero dependencies). For animated number transitions on the progress bar, `@number-flow/react` is the best free option (MIT license, 6.3k GitHub stars). Page transitions in Next.js App Router remain a known pain point -- the recommended approach for this app is to use `template.tsx` for simple enter animations and skip exit animations entirely, keeping complexity low.

**Primary recommendation:** Build the suggestion engine as a pure function (`getSuggestedWeekend`) in `src/lib/suggestions.ts`. Install `motion` for component animations (progress bar, card stagger, celebration), and `canvas-confetti` for the completion celebration burst. Use `template.tsx` for lightweight page enter animations. Skip `AnimateNumber` (it is a paid Motion+ component) and use `@number-flow/react` if animated number display is desired.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.33.0 | Animation library | The standard React animation library. Declarative `<motion.div>` API, layout animations, `AnimatePresence`, spring physics. 18M+ monthly npm downloads. Already in project STACK.md. |
| canvas-confetti | 1.9.4 | Celebration confetti | 1.4M+ weekly downloads, 12.3k GitHub stars, zero dependencies, lightweight. The ecosystem standard for confetti/celebration effects. Supports `disableForReducedMotion` for accessibility. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @number-flow/react | 0.5.11 | Animated number transitions | If you want the progress percentage or completed count to animate smoothly when values change. MIT license, free, built on `Intl.NumberFormat` + Web Animations API. Only needed if animated numbers are desired. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| canvas-confetti | react-confetti-explosion | CSS-only (no canvas), ~31kb, but less configurable and less realistic physics. canvas-confetti is more battle-tested. |
| canvas-confetti | react-confetti | Full-screen confetti rain (rather than explosion). Heavier, depends on `react-use`. Better for sustained rain, worse for a single burst celebration. |
| @number-flow/react | Motion AnimateNumber | AnimateNumber is a paid Motion+ component (requires lifetime membership purchase). @number-flow/react is free MIT, well-maintained, and the original inspiration for AnimateNumber. |
| motion (page transitions) | next-view-transitions / experimental viewTransition | Native View Transitions API is experimental in Next.js 16 and not production-ready. motion + template.tsx is simpler and sufficient for enter animations. |

**Installation:**
```bash
npm install motion canvas-confetti
npm install -D @types/canvas-confetti
# Optional: npm install @number-flow/react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── suggestions.ts          # Pure function: getSuggestedWeekend()
├── components/
│   ├── weekend/
│   │   ├── suggested-weekend-banner.tsx  # "Up Next" banner on overview page
│   │   ├── weekend-card.tsx             # Add motion wrapper for stagger
│   │   ├── progress-overview.tsx        # Add motion for progress bar animation
│   │   └── celebration-overlay.tsx      # canvas-confetti trigger on completion
│   └── motion/
│       └── page-transition.tsx          # Reusable enter animation wrapper
├── app/
│   └── (dashboard)/
│       └── template.tsx                 # Page enter animations
```

### Pattern 1: Suggestion Engine as Pure Function
**What:** A deterministic function that takes weekend data (with completion status) and returns the recommended next weekend.
**When to use:** Called on the server in the overview page's Server Component.
**Example:**
```typescript
// Source: Custom logic based on project requirements
// src/lib/suggestions.ts

type WeekendStatus = "completed" | "in_progress" | "not_started";

type WeekendForSuggestion = {
  id: number;
  number: number;
  category: "foundation" | "core_projects" | "automation" | "system_and_build" | "bonus";
  isBonus: boolean;
  workItems: { isCompleted: boolean; isAdvanced: boolean }[];
};

const CATEGORY_ORDER = [
  "foundation",
  "core_projects",
  "automation",
  "system_and_build",
] as const;

function deriveStatus(workItems: { isCompleted: boolean; isAdvanced: boolean }[]): WeekendStatus {
  const coreItems = workItems.filter((w) => !w.isAdvanced);
  if (coreItems.length === 0) return "not_started";
  const completedCore = coreItems.filter((w) => w.isCompleted).length;
  if (completedCore === coreItems.length) return "completed";
  if (completedCore > 0) return "in_progress";
  return "not_started";
}

export function getSuggestedWeekend(
  weekends: WeekendForSuggestion[]
): WeekendForSuggestion | null {
  // Exclude bonus weekends from suggestions
  const mainWeekends = weekends.filter((w) => !w.isBonus);

  // If all completed, return null (no suggestion)
  const withStatus = mainWeekends.map((w) => ({
    ...w,
    status: deriveStatus(w.workItems),
  }));

  if (withStatus.every((w) => w.status === "completed")) return null;

  // Priority 1: In-progress weekends (prefer lowest number)
  const inProgress = withStatus
    .filter((w) => w.status === "in_progress")
    .sort((a, b) => a.number - b.number);
  if (inProgress.length > 0) return inProgress[0];

  // Priority 2: First not-started weekend respecting category dependency order
  for (const category of CATEGORY_ORDER) {
    const categoryWeekends = withStatus.filter((w) => w.category === category);
    const notStarted = categoryWeekends
      .filter((w) => w.status === "not_started")
      .sort((a, b) => a.number - b.number);
    if (notStarted.length > 0) return notStarted[0];
  }

  return null;
}
```

### Pattern 2: Motion in Next.js App Router (Client Component)
**What:** Use `"use client"` directive with `import { motion } from "motion/react"` for interactive animated components.
**When to use:** Any component that needs animation and is already a client component or can become one.
**Example:**
```typescript
// Source: https://motion.dev/docs/react-installation
"use client"

import { motion } from "motion/react"

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", visualDuration: 0.4, bounce: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
```

### Pattern 3: Motion in Server Components (Reduced JS)
**What:** Use `import * as motion from "motion/react-client"` to render motion components from Server Components while reducing client JS.
**When to use:** When wrapping server-rendered content that only needs simple CSS animations (no gesture handlers, no AnimatePresence).
**Example:**
```typescript
// Source: https://motion.dev/docs/react-motion-component
import * as motion from "motion/react-client"

export default function ServerAnimatedSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Section Title</h2>
    </motion.div>
  )
}
```

### Pattern 4: Page Enter Animations via template.tsx
**What:** Next.js `template.tsx` re-mounts on every route change (unlike `layout.tsx`), making it ideal for page enter animations.
**When to use:** Simple fade-in or slide-up animations on page navigation.
**Example:**
```typescript
// Source: https://dev.to/joseph42a/nextjs-page-transition-with-framer-motion-33dg
// src/app/(dashboard)/template.tsx
"use client"

import { motion } from "motion/react"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
```

### Pattern 5: Celebration Confetti on Weekend Completion
**What:** Trigger a confetti burst when a weekend transitions from incomplete to complete.
**When to use:** In the `toggleWorkItem` flow, after the server action confirms all core items are now completed.
**Example:**
```typescript
// Source: https://github.com/catdad/canvas-confetti
"use client"

import confetti from "canvas-confetti"

function triggerCelebration() {
  // Burst from the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  })
}

// Side cannon pattern for more dramatic effect
function triggerSideCannons() {
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    disableForReducedMotion: true,
  }
  confetti({ ...defaults, particleCount: 30, origin: { x: 0.1, y: 0.6 } })
  confetti({ ...defaults, particleCount: 30, origin: { x: 0.9, y: 0.6 } })
}
```

### Pattern 6: Animated Progress Bar with Motion
**What:** Animate the progress bar fill width using motion's spring physics.
**When to use:** The `ProgressOverview` component when the `value` prop changes.
**Example:**
```typescript
// Source: https://motion.dev/docs/react-motion-component
"use client"

import { motion } from "motion/react"

type AnimatedProgressProps = {
  value: number  // 0-100
}

export function AnimatedProgress({ value }: AnimatedProgressProps) {
  return (
    <div className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full">
      <motion.div
        className="bg-primary h-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", visualDuration: 0.6, bounce: 0.15 }}
      />
    </div>
  )
}
```

### Pattern 7: Staggered Card Entrance
**What:** Cards appear one after another with a slight delay between each.
**When to use:** The `WeekendGrid` component, staggering the appearance of weekend cards.
**Example:**
```typescript
// Source: https://motion.dev/docs/react-motion-component
"use client"

import { motion } from "motion/react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export function StaggeredGrid({ children }: { children: React.ReactNode[] }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4">
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Anti-Patterns to Avoid
- **Exit animations with App Router:** Do NOT try to implement exit animations using `AnimatePresence` + FrozenRouter pattern in Next.js App Router. It is a known broken pattern with unresolved issues (see next.js#49279). Use `template.tsx` for enter-only animations instead.
- **Animating Server Components directly:** Motion components need client-side JS. Either use `"use client"` or the `motion/react-client` import. Do not try to use `motion` from `motion/react` in a Server Component without the `"use client"` directive.
- **Heavy confetti on mobile:** Keep `particleCount` under 100 for mobile performance. Always set `disableForReducedMotion: true` for accessibility.
- **AnimateNumber from motion-plus:** Do not use `AnimateNumber` -- it requires a paid Motion+ membership (`import from "motion-plus/react"`). Use `@number-flow/react` instead if animated numbers are needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti celebration animation | Custom particle system with canvas | `canvas-confetti` | Physics, particle management, performance optimization, accessibility (`disableForReducedMotion`) -- all solved. Zero dependencies, 1.4M+ weekly downloads. |
| Animated progress bar | Manual CSS transition with state | `motion.div` with `animate={{ width }}` | Spring physics feel more natural than linear CSS transitions. Motion handles interruptions (changing value mid-animation) gracefully. |
| Number animation/ticker | Manual digit rolling with CSS | `@number-flow/react` | Handles digit spinning, formatting (via `Intl.NumberFormat`), accessibility, and cross-browser support. MIT, free, 6.3k stars. |
| Page enter transitions | Custom transition provider with context | `template.tsx` + `motion.div` | Next.js `template.tsx` remounts on navigation by design. Wrapping children in a `motion.div` with `initial`/`animate` is 5 lines of code. |
| Staggered list animations | Manual setTimeout chains | Motion variants with `staggerChildren` | Variants propagate through the component tree. `staggerChildren` handles timing. Motion handles interruptions if data changes mid-animation. |

**Key insight:** The only custom logic in this phase is the suggestion algorithm. Everything visual should use existing libraries -- animation libraries exist specifically because animation math (spring physics, interruption handling, timing coordination) is deceptively complex.

## Common Pitfalls

### Pitfall 1: Triggering Celebration at the Wrong Time
**What goes wrong:** Confetti fires on every checkbox toggle, not just when all core items become completed.
**Why it happens:** The celebration is triggered on the `toggleWorkItem` response without checking whether the weekend transitioned from incomplete to complete.
**How to avoid:** The `toggleWorkItem` server action already computes `allCoreCompleted` and updates `completedAt`. Return this status change information from the server action (e.g., `{ weekendJustCompleted: true }`). Only trigger confetti when `weekendJustCompleted` is true AND `completedAt` was previously null.
**Warning signs:** Confetti on unchecking a box, or confetti when toggling an already-completed weekend.

### Pitfall 2: Motion in Server Components Without Proper Import
**What goes wrong:** Build error or hydration mismatch when using `import { motion } from "motion/react"` in a Server Component.
**Why it happens:** The `motion/react` export includes hooks and client-side logic. Server Components cannot use hooks.
**How to avoid:** Either add `"use client"` to the file, or use `import * as motion from "motion/react-client"` for server-safe motion components. Most components in this app that need animation are already client components (e.g., `WorkItemRow`, `WorkItemList`).
**Warning signs:** "useState is not a function" or "Cannot use hooks in Server Component" errors.

### Pitfall 3: Exit Animations in Next.js App Router
**What goes wrong:** `AnimatePresence` exit animations don't play when navigating between routes in App Router.
**Why it happens:** Next.js App Router unmounts route components immediately on navigation, before Motion can intercept. This is a known, unresolved issue between Next.js and Motion (open since 2023, still unresolved as of early 2026).
**How to avoid:** Do NOT implement route exit animations. Use `template.tsx` for enter-only animations. Within a page, `AnimatePresence` works fine for conditional rendering (show/hide elements) -- just not for route changes.
**Warning signs:** Exit animations that work in dev but break in production, or flash of content on navigation.

### Pitfall 4: Canvas-Confetti in SSR
**What goes wrong:** `canvas-confetti` tries to access `document` during server rendering and crashes.
**Why it happens:** `canvas-confetti` is a browser-only library.
**How to avoid:** Only import and call `confetti()` inside client components, inside event handlers or `useEffect`. Never call at module scope. Use dynamic import if needed: `const confetti = (await import("canvas-confetti")).default`.
**Warning signs:** "document is not defined" error during build or SSR.

### Pitfall 5: Suggestion Ignoring In-Progress Weekends
**What goes wrong:** The suggestion always picks the first not-started weekend by category order, skipping weekends the user already started.
**Why it happens:** The algorithm only checks category dependency order without prioritizing in-progress work.
**How to avoid:** Always check for in-progress weekends first (highest priority), then fall back to category dependency order for not-started weekends.
**Warning signs:** User starts Weekend 5 but suggestion keeps pointing to Weekend 3.

### Pitfall 6: Confetti Without Accessibility Consideration
**What goes wrong:** Users with motion sensitivities experience discomfort from sudden particle animations.
**Why it happens:** No check for `prefers-reduced-motion` media query.
**How to avoid:** `canvas-confetti` has a built-in `disableForReducedMotion: true` option -- always set it. For Motion animations, respect the user's preference with `useReducedMotion()` hook from `motion/react`.
**Warning signs:** Accessibility audit failures, user complaints about motion.

## Code Examples

### Celebration Detection in toggleWorkItem
```typescript
// Source: Based on existing src/lib/actions.ts pattern
// Modify toggleWorkItem to return completion transition info

export async function toggleWorkItem(itemId: number) {
  const id = z.number().int().positive().parse(itemId);

  const [updated] = await db
    .update(workItems)
    .set({
      isCompleted: not(workItems.isCompleted),
      updatedAt: new Date(),
    })
    .where(eq(workItems.id, id))
    .returning();

  if (!updated) return { weekendJustCompleted: false };

  const allItems = await db.query.workItems.findMany({
    where: eq(workItems.weekendId, updated.weekendId),
  });
  const coreItems = allItems.filter((item) => !item.isAdvanced);
  const allCoreCompleted =
    coreItems.length > 0 && coreItems.every((item) => item.isCompleted);

  // Check if weekend was NOT previously completed
  const [weekend] = await db
    .select({ completedAt: weekends.completedAt })
    .from(weekends)
    .where(eq(weekends.id, updated.weekendId));

  const wasAlreadyCompleted = weekend?.completedAt !== null;
  const weekendJustCompleted = allCoreCompleted && !wasAlreadyCompleted;

  await db
    .update(weekends)
    .set({
      completedAt: allCoreCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, updated.weekendId));

  revalidatePath("/");
  revalidatePath(`/weekend/${updated.weekendId}`);

  return { weekendJustCompleted };
}
```

### Suggested Weekend Banner Component
```typescript
// Source: Pattern based on project's existing component style
"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type SuggestedWeekendBannerProps = {
  weekendId: number
  weekendNumber: number
  weekendName: string
}

export function SuggestedWeekendBanner({
  weekendId,
  weekendNumber,
  weekendName,
}: SuggestedWeekendBannerProps) {
  return (
    <Link href={`/weekend/${weekendId}`}>
      <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Up Next
              </p>
              <p className="text-sm font-medium">
                Weekend {weekendNumber}: {weekendName}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </CardContent>
      </Card>
    </Link>
  )
}
```

### Using canvas-confetti Safely in a Client Component
```typescript
// Source: https://github.com/catdad/canvas-confetti
"use client"

import { useCallback } from "react"

export function useCelebration() {
  const celebrate = useCallback(async () => {
    // Dynamic import ensures no SSR issues
    const confetti = (await import("canvas-confetti")).default

    // Fire from both sides for dramatic effect
    const defaults = {
      disableForReducedMotion: true,
      zIndex: 9999,
    }

    confetti({
      ...defaults,
      particleCount: 40,
      spread: 55,
      origin: { x: 0.3, y: 0.6 },
    })
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 55,
      origin: { x: 0.7, y: 0.6 },
    })
  }, [])

  return celebrate
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package | Late 2024 | Same library, rebranded. Import from `motion/react` instead of `framer-motion`. All APIs identical. |
| Individual `@radix-ui/react-*` packages | Unified `radix-ui` package | 2025 | Already using unified package in this project. |
| CSS `transition` for progress bars | Motion spring animations | Ongoing | Springs feel more natural, handle interruptions. CSS transitions snap to new value if interrupted mid-animation. |
| FrozenRouter for page exit animations | `template.tsx` for enter animations only | 2024-2025 | The community abandoned the FrozenRouter hack. Enter-only via template.tsx is the pragmatic consensus. |
| Custom confetti implementations | `canvas-confetti` library | Mature (2019+) | Battle-tested, accessible, performant. No reason to build custom. |
| React-based number animation | `@number-flow/react` (MIT) | 2024-2025 | Built on Web Animations API, not React state. Smoother, more performant than React-driven digit rolling. |

**Deprecated/outdated:**
- `framer-motion` npm package: Still works but the library was rebranded to `motion`. Use `motion/react` imports.
- FrozenRouter pattern: Documented widely in 2023-2024 blog posts but causes navigation bugs. Avoid.
- `react-spring` for simple animations: Motion has won the ecosystem. react-spring is still maintained but less popular.

## Open Questions

1. **Return value from Server Actions**
   - What we know: The current `toggleWorkItem` returns `void`. To signal "weekend just completed" to the client, it needs to return data.
   - What's unclear: Whether Next.js server actions can reliably return data that the calling client component can use to trigger side effects (like confetti). The pattern works in theory with `useTransition` + return values, but we should verify.
   - Recommendation: Test this pattern in implementation. Fallback: use `useOptimistic` state to detect the transition client-side by comparing previous and current completion state.

2. **Animated progress percentage text**
   - What we know: `@number-flow/react` v0.5.11 can animate number changes beautifully.
   - What's unclear: Whether the visual weight of an animated number counter is worth the 6KB dependency for a single "3/10 weekends" display.
   - Recommendation: Start without it. Use plain text for the count. If it feels flat after Motion animations are added to the progress bar, add @number-flow/react as a polish pass.

3. **Reduced motion preference scope**
   - What we know: `canvas-confetti` has `disableForReducedMotion`. Motion has `useReducedMotion()`.
   - What's unclear: Whether we need a global reduced-motion context, or if checking per-component is sufficient.
   - Recommendation: Per-component checking is fine for this app's scale. `canvas-confetti` handles it with a prop. Motion components can use the `useReducedMotion()` hook individually.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/motion_dev` - Motion component API, AnimatePresence, layout animations, spring transitions, `motion/react-client` import, AnimateNumber details
- Context7 `/websites/motion_dev_react` - useAnimate, useInView, useMotionValueEvent, AnimatePresence with key changes
- [Motion official docs: React installation](https://motion.dev/docs/react-installation) - Next.js App Router integration, `"use client"` and `motion/react-client` patterns
- [Motion official docs: React motion component](https://motion.dev/docs/react-motion-component) - `motion.div` API, Server Component import path
- [Motion official docs: AnimateNumber](https://motion.dev/docs/react-animate-number) - Confirmed as Motion+ (paid) exclusive component
- npm CLI verification: `motion@12.33.0`, `canvas-confetti@1.9.4`, `@number-flow/react@0.5.11`, `react-confetti-explosion@3.0.3` (all verified 2026-02-07)

### Secondary (MEDIUM confidence)
- [GitHub: canvas-confetti](https://github.com/catdad/canvas-confetti) - API, `disableForReducedMotion`, 12.3k stars
- [GitHub: next.js#49279](https://github.com/vercel/next.js/issues/49279) - App Router + Framer Motion shared layout animation issue (still open)
- [GitHub: next.js discussion#42658](https://github.com/vercel/next.js/discussions/42658) - Animating route transitions in App Router
- [DEV.to: Next.js page transitions](https://dev.to/joseph42a/nextjs-page-transition-with-framer-motion-33dg) - template.tsx pattern
- [Next.js docs: viewTransition experimental](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) - Confirmed experimental, not production-ready
- [GitHub: number-flow](https://github.com/barvian/number-flow) - 6.3k stars, MIT license, used by X and Dub.co
- [npm: @number-flow/react](https://www.npmjs.com/package/@number-flow/react) - v0.5.11, active maintenance

### Tertiary (LOW confidence)
- [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router) - FrozenRouter pattern details (useful for understanding what NOT to do)
- [Yeti case study: Confetti + Framer Motion](https://www.yeti.co/lab-case-studies/framer-motion-confetti-effects) - Design patterns for celebration UX

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm, docs confirmed via Context7 and official sites
- Architecture (suggestion engine): HIGH - Pure function on existing data model, no external dependencies, algorithm is straightforward
- Architecture (animation): HIGH - Motion API verified via Context7, patterns confirmed across multiple official sources
- Architecture (page transitions): MEDIUM - The `template.tsx` enter-only pattern works, but full enter+exit transitions remain an unsolved ecosystem problem
- Pitfalls: HIGH - Known issues well-documented across GitHub issues, official docs, and community posts

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, libraries are mature)

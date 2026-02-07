import type { WeekendWithWorkItems } from "@/components/weekend/weekend-card";

type WeekendStatus = "completed" | "in_progress" | "not_started";

const CATEGORY_ORDER = [
  "foundation",
  "core_projects",
  "automation",
  "system_and_build",
] as const;

function deriveStatus(
  workItems: WeekendWithWorkItems["workItems"]
): WeekendStatus {
  const coreItems = workItems.filter((w) => !w.isAdvanced);
  if (coreItems.length === 0) return "not_started";
  const completedCore = coreItems.filter((w) => w.isCompleted).length;
  if (completedCore === coreItems.length) return "completed";
  if (completedCore > 0) return "in_progress";
  return "not_started";
}

/**
 * Pure function that recommends which weekend to tackle next.
 *
 * Algorithm:
 * 1. Filter out bonus weekends
 * 2. Derive status for each weekend from its work items
 * 3. If all weekends are completed, return null
 * 4. Priority 1: First in-progress weekend (lowest number)
 * 5. Priority 2: First not-started weekend respecting category dependency order
 */
export function getSuggestedWeekend(
  weekends: WeekendWithWorkItems[]
): WeekendWithWorkItems | null {
  const mainWeekends = weekends.filter((w) => !w.isBonus);

  const withStatus = mainWeekends.map((w) => ({
    weekend: w,
    status: deriveStatus(w.workItems),
  }));

  // All completed — nothing to suggest
  if (withStatus.every((w) => w.status === "completed")) return null;

  // Priority 1: In-progress weekends (prefer lowest number)
  const inProgress = withStatus
    .filter((w) => w.status === "in_progress")
    .sort((a, b) => a.weekend.number - b.weekend.number);
  if (inProgress.length > 0) return inProgress[0].weekend;

  // Priority 2: First not-started weekend respecting category dependency order
  for (const category of CATEGORY_ORDER) {
    const notStarted = withStatus
      .filter(
        (w) => w.weekend.category === category && w.status === "not_started"
      )
      .sort((a, b) => a.weekend.number - b.weekend.number);
    if (notStarted.length > 0) return notStarted[0].weekend;
  }

  return null;
}

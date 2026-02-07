import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { weekends } from "@/db/schema";

/**
 * Fetch all weekends with work items for progress display.
 * Only fetches isCompleted and isAdvanced columns from work items for efficiency.
 */
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

/**
 * Fetch a single weekend by ID with all related data.
 * Used by the detail page.
 */
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

import { db } from "@/lib/db";
import { eq, isNotNull, sql } from "drizzle-orm";
import { scorecardRatings, weekends } from "@/db/schema";

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
      scorecardRatings: true,
    },
  });
}

/**
 * Fetch average scorecard ratings grouped by weekend and criterion.
 * Uses the SQL builder API (not relational) for aggregation support.
 * Only includes completed weekends.
 */
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

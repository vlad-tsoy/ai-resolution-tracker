import { db } from "@/lib/db";
import { weekends, workItems, doneCriteria } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const weekendCount = await db.select({ count: count() }).from(weekends);
  const workItemCount = await db.select({ count: count() }).from(workItems);
  const doneCriteriaCount = await db
    .select({ count: count() })
    .from(doneCriteria);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        AI Resolution Tracker — Seed Verification
      </h1>
      <ul className="mt-4 space-y-1">
        <li>Weekends: {weekendCount[0].count} (expected: 11)</li>
        <li>Work Items: {workItemCount[0].count} (expected: ~55-65)</li>
        <li>Done Criteria: {doneCriteriaCount[0].count} (expected: 11)</li>
      </ul>
    </main>
  );
}

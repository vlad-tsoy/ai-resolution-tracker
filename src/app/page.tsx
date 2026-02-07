import { db } from "@/lib/db";
import { weekends } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allWeekends = await db.select().from(weekends);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        AI Resolution Tracker
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Database connected. Weekends in DB: {allWeekends.length}
      </p>
    </main>
  );
}

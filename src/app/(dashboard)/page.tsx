import { getWeekendsWithProgress } from "@/lib/queries";
import { getSuggestedWeekend } from "@/lib/suggestions";
import { ProgressOverview } from "@/components/weekend/progress-overview";
import { SuggestedWeekendBanner } from "@/components/weekend/suggested-weekend-banner";
import { WeekendGrid } from "@/components/weekend/weekend-grid";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const weekends = await getWeekendsWithProgress();

  const mainWeekends = weekends.filter((w) => !w.isBonus);

  // A weekend is "completed" when ALL core (non-advanced) work items are done.
  // A weekend with zero core items is NOT counted as completed.
  const completedCount = mainWeekends.filter((w) => {
    const coreItems = w.workItems.filter((item) => !item.isAdvanced);
    if (coreItems.length === 0) return false;
    return coreItems.every((item) => item.isCompleted);
  }).length;

  const suggested = getSuggestedWeekend(weekends);

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">
        AI Resolution Tracker
      </h1>
      <ProgressOverview completed={completedCount} total={10} />
      {suggested && (
        <SuggestedWeekendBanner
          weekendId={suggested.id}
          weekendNumber={suggested.number}
          weekendName={suggested.name}
        />
      )}
      <WeekendGrid weekends={weekends} />
    </main>
  );
}

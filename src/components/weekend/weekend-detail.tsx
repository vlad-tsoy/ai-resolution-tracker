import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkItemList } from "@/components/weekend/work-item-list";
import type { getWeekendById } from "@/lib/queries";

type WeekendData = NonNullable<Awaited<ReturnType<typeof getWeekendById>>>;

type WeekendDetailProps = {
  weekend: WeekendData;
};

export function WeekendDetail({ weekend }: WeekendDetailProps) {
  const coreItems = weekend.workItems.filter((item) => !item.isAdvanced);
  const advancedItems = weekend.workItems.filter((item) => item.isAdvanced);

  return (
    <article className="max-w-2xl mx-auto space-y-8">
      {/* Back navigation */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to weekends
      </Link>

      {/* Header */}
      <header className="space-y-2">
        <span className="text-sm text-muted-foreground">
          Weekend {weekend.number}
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{weekend.name}</h1>
        <p className="text-muted-foreground">{weekend.deliverable}</p>
      </header>

      {/* Core Work Items */}
      <WorkItemList items={coreItems} title="Core Work" />

      {/* Advanced Modifiers */}
      {advancedItems.length > 0 && (
        <section className="space-y-3 text-muted-foreground">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Advanced Modifiers
            </h2>
            <Badge variant="outline">Optional</Badge>
          </div>
          <ul className="space-y-2">
            {advancedItems.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5">
                {item.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span className="text-sm leading-relaxed">{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Why It Matters */}
      {weekend.whyItMatters && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Why It Matters
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {weekend.whyItMatters}
          </p>
        </section>
      )}

      {/* Done When */}
      {weekend.doneCriteria.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Done When</h2>
          <ul className="space-y-2">
            {weekend.doneCriteria.map((criterion) => (
              <li key={criterion.id} className="flex items-start gap-2.5">
                {criterion.isMet ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <span className="text-sm leading-relaxed">
                  {criterion.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

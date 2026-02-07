import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkItemList } from "@/components/weekend/work-item-list";
import { NotesEditor } from "@/components/weekend/notes-editor";
import { ScorecardSection } from "@/components/weekend/scorecard-section";
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
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Core Work</h2>
        <WorkItemList items={coreItems} />
      </section>

      {/* Advanced Modifiers */}
      {advancedItems.length > 0 && (
        <section className="space-y-3 text-muted-foreground">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Advanced Modifiers
            </h2>
            <Badge variant="outline">Optional</Badge>
          </div>
          <WorkItemList items={advancedItems} />
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

      {/* Notes Editor */}
      <NotesEditor weekendId={weekend.id} initialNotes={weekend.notes} />

      {/* Scorecard */}
      {weekend.completedAt ? (
        <ScorecardSection
          weekendId={weekend.id}
          ratings={weekend.scorecardRatings}
          scorecardNotes={weekend.scorecardNotes}
        />
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
    </article>
  );
}

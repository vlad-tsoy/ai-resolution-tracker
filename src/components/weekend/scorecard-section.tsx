"use client";

import { RatingScale } from "@/components/weekend/rating-scale";
import { UseAgainToggle } from "@/components/weekend/use-again-toggle";
import { ScorecardNotesEditor } from "@/components/weekend/scorecard-notes-editor";

type ScorecardSectionProps = {
  weekendId: number;
  ratings: Array<{
    id: number;
    criterion: string;
    rating: number | null;
    comment: string | null;
  }>;
  scorecardNotes: string | null;
};

export function ScorecardSection({
  weekendId,
  ratings,
  scorecardNotes,
}: ScorecardSectionProps) {
  const ratingMap = new Map(ratings.map((r) => [r.criterion, r.rating]));

  const getRating = (key: string) => {
    const v = ratingMap.get(key);
    return v != null ? Math.round(v) : null;
  };

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Scorecard</h2>

      {/* Rating dimensions */}
      <div className="space-y-5">
        <RatingScale
          weekendId={weekendId}
          criterion="outcome_quality"
          label="Outcome Quality"
          description="How good was the final result?"
          currentValue={getRating("outcome_quality")}
        />
        <RatingScale
          weekendId={weekendId}
          criterion="time_saved"
          label="Time Saved"
          description="How much time did AI save you?"
          currentValue={getRating("time_saved")}
        />
        <RatingScale
          weekendId={weekendId}
          criterion="repeatability"
          label="Repeatability"
          description="Could you reproduce this approach?"
          currentValue={getRating("repeatability")}
        />
        <UseAgainToggle
          weekendId={weekendId}
          currentValue={getRating("use_again")}
        />
      </div>

      {/* Scorecard notes */}
      <ScorecardNotesEditor
        weekendId={weekendId}
        initialNotes={scorecardNotes}
      />
    </section>
  );
}

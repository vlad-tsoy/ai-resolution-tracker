"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ScoreTrendsChart = dynamic(
  () => import("@/components/weekend/score-trends-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    ),
  }
);

type ScoreRow = {
  weekendNumber: number;
  weekendName: string;
  criterion: string;
  avgRating: number;
};

export function ScoreTrendsSection({ data }: { data: ScoreRow[] }) {
  return <ScoreTrendsChart data={data} />;
}

"use client";

import { motion } from "motion/react";

type ProgressOverviewProps = {
  completed: number;
  total: number;
};

export function ProgressOverview({ completed, total }: ProgressOverviewProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Overall Progress
        </h2>
        <span className="text-sm font-medium">
          {completed}/{total} weekends &middot; {percent}%
        </span>
      </div>
      <div
        className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${completed} of ${total} weekends completed`}
      >
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", visualDuration: 0.6, bounce: 0.15 }}
        />
      </div>
    </div>
  );
}

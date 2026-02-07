import { Progress } from "@/components/ui/progress";

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
      <Progress
        value={percent}
        aria-label={`${completed} of ${total} weekends completed`}
        className="h-2"
      />
    </div>
  );
}

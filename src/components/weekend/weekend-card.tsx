import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { getWeekendsWithProgress } from "@/lib/queries";

export type WeekendWithWorkItems = Awaited<
  ReturnType<typeof getWeekendsWithProgress>
>[number];

type WeekendStatus = "completed" | "in_progress" | "not_started";

const statusConfig: Record<
  WeekendStatus,
  {
    icon: typeof CheckCircle2;
    label: string;
    variant: "default" | "secondary" | "outline";
    cardClass: string;
  }
> = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    variant: "default",
    cardClass: "opacity-80",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    variant: "secondary",
    cardClass: "ring-2 ring-primary/20",
  },
  not_started: {
    icon: Circle,
    label: "Not Started",
    variant: "outline",
    cardClass: "",
  },
};

function deriveStatus(
  workItems: WeekendWithWorkItems["workItems"]
): WeekendStatus {
  const coreItems = workItems.filter((w) => !w.isAdvanced);
  if (coreItems.length === 0) return "not_started";
  const completedCore = coreItems.filter((w) => w.isCompleted).length;
  if (completedCore === coreItems.length) return "completed";
  if (completedCore > 0) return "in_progress";
  return "not_started";
}

type WeekendCardProps = {
  weekend: WeekendWithWorkItems;
};

export function WeekendCard({ weekend }: WeekendCardProps) {
  const status = deriveStatus(weekend.workItems);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const coreItems = weekend.workItems.filter((w) => !w.isAdvanced);
  const completedCore = coreItems.filter((w) => w.isCompleted).length;

  return (
    <Link href={`/weekend/${weekend.id}`}>
      <Card
        className={`transition-colors hover:bg-accent/50 ${config.cardClass}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Weekend {weekend.number}
            </span>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <CardTitle className="text-base">{weekend.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {weekend.deliverable}
          </CardDescription>
          {coreItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {completedCore}/{coreItems.length} core items
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

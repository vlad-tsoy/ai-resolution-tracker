import { CheckCircle2, Circle } from "lucide-react";

type WorkItem = {
  id: number;
  title: string;
  isAdvanced: boolean;
  isCompleted: boolean;
};

type WorkItemListProps = {
  items: WorkItem[];
  title: string;
};

export function WorkItemList({ items, title }: WorkItemListProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            {item.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <span className="text-sm leading-relaxed">{item.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

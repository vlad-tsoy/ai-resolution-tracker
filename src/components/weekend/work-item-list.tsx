"use client";

import { WorkItemRow } from "@/components/weekend/work-item-row";

type WorkItem = {
  id: number;
  title: string;
  isAdvanced: boolean;
  isCompleted: boolean;
};

type WorkItemListProps = {
  items: WorkItem[];
};

export function WorkItemList({ items }: WorkItemListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <WorkItemRow
          key={item.id}
          id={item.id}
          title={item.title}
          isCompleted={item.isCompleted}
          isAdvanced={item.isAdvanced}
        />
      ))}
    </div>
  );
}

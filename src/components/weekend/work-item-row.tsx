"use client";

import { useOptimistic, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleWorkItem } from "@/lib/actions";

type WorkItemRowProps = {
  id: number;
  title: string;
  isCompleted: boolean;
  isAdvanced: boolean;
};

export function WorkItemRow({
  id,
  title,
  isCompleted,
  isAdvanced,
}: WorkItemRowProps) {
  const [optimisticCompleted, setOptimisticCompleted] =
    useOptimistic(isCompleted);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleWorkItem(id);
    });
  }

  return (
    <label
      className={`flex items-start gap-2.5 cursor-pointer ${isPending ? "opacity-70" : ""}`}
    >
      <Checkbox
        checked={optimisticCompleted}
        onCheckedChange={handleToggle}
        className="mt-0.5"
      />
      <span
        className={`text-sm leading-relaxed ${
          optimisticCompleted
            ? "line-through text-muted-foreground"
            : isAdvanced
              ? "text-muted-foreground"
              : ""
        }`}
      >
        {title}
      </span>
    </label>
  );
}

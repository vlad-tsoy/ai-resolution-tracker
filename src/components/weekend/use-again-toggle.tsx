"use client";

import { useOptimistic, useTransition } from "react";
import { saveRating } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type UseAgainToggleProps = {
  weekendId: number;
  currentValue: number | null;
};

export function UseAgainToggle({
  weekendId,
  currentValue,
}: UseAgainToggleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(checked: boolean) {
    const numValue = checked ? 1 : 0;
    startTransition(async () => {
      setOptimisticValue(numValue);
      await saveRating(weekendId, "use_again", numValue);
    });
  }

  return (
    <div
      className={`flex items-center justify-between ${isPending ? "opacity-70" : ""}`}
    >
      <Label>Use Again?</Label>
      <div className="flex items-center gap-2">
        {optimisticValue != null && (
          <span className="text-sm text-muted-foreground">
            {optimisticValue === 1 ? "Yes" : "No"}
          </span>
        )}
        <Switch
          checked={optimisticValue === 1}
          onCheckedChange={handleCheckedChange}
        />
      </div>
    </div>
  );
}

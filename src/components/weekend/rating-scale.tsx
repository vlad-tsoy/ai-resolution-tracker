"use client";

import { useOptimistic, useTransition } from "react";
import { saveRating } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type RatingScaleProps = {
  weekendId: number;
  criterion: string;
  label: string;
  description?: string;
  currentValue: number | null;
};

export function RatingScale({
  weekendId,
  criterion,
  label,
  description,
  currentValue,
}: RatingScaleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);
  const [isPending, startTransition] = useTransition();

  function handleValueChange(value: string) {
    // Deselection guard: ToggleGroup sends empty string when deselecting
    if (!value) return;

    const numValue = parseInt(value, 10);
    startTransition(async () => {
      setOptimisticValue(numValue);
      await saveRating(weekendId, criterion, numValue);
    });
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <ToggleGroup
        type="single"
        value={optimisticValue?.toString() ?? ""}
        onValueChange={handleValueChange}
        className={isPending ? "opacity-70" : ""}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <ToggleGroupItem
            key={n}
            value={n.toString()}
            aria-label={`${label}: ${n} out of 5`}
            className="w-10 h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

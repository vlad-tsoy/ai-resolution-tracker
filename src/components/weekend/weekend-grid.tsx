import { CategorySection } from "./category-section";
import { WeekendCard, type WeekendWithWorkItems } from "./weekend-card";

const CATEGORIES = [
  { key: "foundation", label: "Foundation" },
  { key: "core_projects", label: "Core Projects" },
  { key: "automation", label: "Automation" },
  { key: "system_and_build", label: "System & Build" },
] as const;

type WeekendGridProps = {
  weekends: WeekendWithWorkItems[];
};

export function WeekendGrid({ weekends }: WeekendGridProps) {
  const mainWeekends = weekends.filter((w) => !w.isBonus);
  const bonusWeekend = weekends.find((w) => w.isBonus);

  return (
    <div className="space-y-10">
      {CATEGORIES.map(({ key, label }) => {
        const categoryWeekends = mainWeekends.filter(
          (w) => w.category === key
        );
        if (categoryWeekends.length === 0) return null;
        return (
          <CategorySection
            key={key}
            title={label}
            weekends={categoryWeekends}
          />
        );
      })}

      {bonusWeekend && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-4">Bonus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <WeekendCard weekend={bonusWeekend} />
          </div>
        </section>
      )}
    </div>
  );
}

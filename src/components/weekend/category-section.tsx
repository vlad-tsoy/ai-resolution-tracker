import { WeekendCard, type WeekendWithWorkItems } from "./weekend-card";

type CategorySectionProps = {
  title: string;
  weekends: WeekendWithWorkItems[];
};

export function CategorySection({ title, weekends }: CategorySectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {weekends.map((weekend) => (
          <WeekendCard key={weekend.id} weekend={weekend} />
        ))}
      </div>
    </section>
  );
}

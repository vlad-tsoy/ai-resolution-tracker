import { db } from "@/lib/db";
import { weekends } from "@/db/schema";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  foundation: "Foundation",
  core_projects: "Core Projects",
  automation: "Automation",
  system_and_build: "System & Build",
  bonus: "Bonus",
};

export default async function HomePage() {
  const allWeekends = await db
    .select()
    .from(weekends)
    .orderBy(weekends.number);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="px-6 pt-20 pb-16 sm:px-8 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            10-Weekend Program
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            AI Resolution
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Build real AI fluency, one weekend at a time.
          </p>
        </div>
      </header>

      {/* Weekend List */}
      <main className="px-6 pb-24 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-1">
            {allWeekends.map((weekend, index) => (
              <div key={weekend.id}>
                {/* Category divider - show when category changes */}
                {(index === 0 ||
                  allWeekends[index - 1].category !== weekend.category) && (
                  <div
                    className={`${index === 0 ? "" : "mt-10"} mb-4 flex items-center gap-3`}
                  >
                    <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                      {categoryLabels[weekend.category] ?? weekend.category}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                {/* Weekend row */}
                <div className="group flex items-start gap-5 rounded-xl px-4 py-4 transition-colors hover:bg-accent/60">
                  {/* Number */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
                    {weekend.isBonus ? (
                      <span className="text-xs">+</span>
                    ) : (
                      String(weekend.number).padStart(2, "0")
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-[15px] font-medium leading-snug">
                      {weekend.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {weekend.deliverable}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs text-muted-foreground">
            Built during Weekend 1
          </p>
        </div>
      </footer>
    </div>
  );
}

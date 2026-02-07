import { Skeleton } from "@/components/ui/skeleton";

export default function WeekendDetailLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <article className="max-w-2xl mx-auto space-y-8">
        {/* Back link skeleton */}
        <Skeleton className="h-4 w-32" />

        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Core Work section */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Modifiers section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Why It Matters section */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Done When section */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}

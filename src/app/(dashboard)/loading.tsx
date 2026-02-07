import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const CATEGORY_SKELETONS = [
  { id: 1, cards: 2 },
  { id: 2, cards: 4 },
  { id: 3, cards: 2 },
  { id: 4, cards: 2 },
];

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      {/* Title skeleton */}
      <Skeleton className="h-9 w-64" />

      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Category section skeletons */}
      <div className="space-y-10">
        {CATEGORY_SKELETONS.map((section) => (
          <div key={section.id} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: section.cards }).map((_, j) => (
                <Card key={j}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

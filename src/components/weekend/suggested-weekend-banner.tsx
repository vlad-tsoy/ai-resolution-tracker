import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type SuggestedWeekendBannerProps = {
  weekendId: number;
  weekendNumber: number;
  weekendName: string;
};

export function SuggestedWeekendBanner({
  weekendId,
  weekendNumber,
  weekendName,
}: SuggestedWeekendBannerProps) {
  return (
    <Link href={`/weekend/${weekendId}`}>
      <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Up Next
              </p>
              <p className="text-sm font-medium">
                Weekend {weekendNumber}: {weekendName}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

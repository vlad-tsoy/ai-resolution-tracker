"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WeekendDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Weekend detail error:", error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold">Unable to load weekend</h2>
        <p className="text-sm text-muted-foreground">
          There was a problem loading this weekend&apos;s details. Please try
          again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Back to weekends
          </Link>
        </div>
      </div>
    </main>
  );
}

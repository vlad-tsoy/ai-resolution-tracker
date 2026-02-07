"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-white font-sans antialiased">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-500">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

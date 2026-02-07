"use client";

import { useCallback } from "react";

export function useCelebration() {
  const celebrate = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;

    const defaults = {
      disableForReducedMotion: true,
      zIndex: 9999,
    };

    // Fire from both sides for dramatic effect
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 55,
      origin: { x: 0.3, y: 0.6 },
    });
    confetti({
      ...defaults,
      particleCount: 40,
      spread: 55,
      origin: { x: 0.7, y: 0.6 },
    });
  }, []);

  return celebrate;
}

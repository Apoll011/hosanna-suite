"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./motion";

export function usePresence(present: boolean, exitDuration = 180) {
  const [mounted, setMounted] = useState(present);
  const duration = prefersReducedMotion() ? 0 : exitDuration;

  useEffect(() => {
    if (present) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration, present]);

  return mounted;
}

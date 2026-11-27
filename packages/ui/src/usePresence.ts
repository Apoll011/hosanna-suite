import { useEffect, useState } from "react";

export function usePresence(present: boolean, exitDuration = 180) {
  const [mounted, setMounted] = useState(present);

  useEffect(() => {
    if (present) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), exitDuration);
    return () => window.clearTimeout(timer);
  }, [exitDuration, present]);

  return mounted;
}

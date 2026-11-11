"use client";

import { useEffect } from "react";

/**
 * Auth PWA housekeeping (unlike Studio's update toast):
 * - Block browser install prompts (`beforeinstallprompt`)
 * - On SW takeover (`controllerchange`), reload once so the new build is used
 */
export function SilentPwaUpdater() {
  useEffect(() => {
    const blockInstall = (event: Event) => {
      event.preventDefault();
    };
    window.addEventListener("beforeinstallprompt", blockInstall);

    if (!("serviceWorker" in navigator)) {
      return () => window.removeEventListener("beforeinstallprompt", blockInstall);
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", blockInstall);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}

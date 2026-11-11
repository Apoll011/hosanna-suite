/**
 * Auth → Studio handoff (mirror of Studio's authAccountHandoff).
 * Warm TLS early, sync theme cookie, then assign — no overlay/flash path.
 */

import { getStudioUrl } from "@/lib/redirect";
import { writeThemeCookie } from "@/lib/theme-boot";
import { warmHosannaAppOrigin } from "@hosanna/logos-ai";

let warmed = false;

/** Warm Studio origin only — no document fetches. */
export function prefetchStudioApp(): void {
  if (typeof document === "undefined" || warmed) return;
  warmed = true;
  warmHosannaAppOrigin(getStudioUrl());
}

export type NavigateToStudioOptions = {
  /** Path under Studio origin, e.g. `/{orgSlug}` or `/{orgSlug}/songs`. */
  path?: string;
};

/**
 * Navigate to Studio immediately with the same smoothness as Studio → Auth:
 * theme cookie + connection warm + location.assign.
 */
export function navigateToStudioApp(options?: NavigateToStudioOptions): void {
  const path = options?.path?.trim() || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${getStudioUrl()}${normalized}`;

  writeThemeCookie(document.documentElement.classList.contains("dark") ? "dark" : "light");
  prefetchStudioApp();
  window.location.assign(url);
}

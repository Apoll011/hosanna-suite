/**
 * Studio → auth /account handoff.
 *
 * Cross-origin hard navigations are not helped by fetch()-prefetching the
 * HTML/session (separate cache, CORS, steals bandwidth). What actually helps:
 * warm the TLS connection early (preconnect), then assign immediately on click.
 */

import { authAppHref, getAuthAppUrl } from "./authUrl";
import { writeThemeCookie } from "./themeBoot";

let warmed = false;

/** Warm auth origin only — no document/session fetches. */
export function prefetchAuthAccount(): void {
  if (typeof document === "undefined" || warmed) return;
  warmed = true;

  const origin = getAuthAppUrl();

  const ensureLink = (rel: string, href: string) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (rel === "preconnect") link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  };

  ensureLink("dns-prefetch", origin);
  ensureLink("preconnect", origin);
}

/**
 * Navigate to auth /account immediately.
 * No overlay, view-transition, or competing prefetch on the click path.
 */
export function navigateToAuthAccount(options?: { returnUrl?: string }): void {
  const returnUrl =
    options?.returnUrl ?? (typeof window !== "undefined" ? window.location.href : undefined);
  const url = authAppHref("/account", { returnUrl });

  writeThemeCookie(document.documentElement.classList.contains("dark") ? "dark" : "light");
  // Best-effort connection warm if idle prefetch never ran — still non-blocking.
  prefetchAuthAccount();
  window.location.assign(url);
}

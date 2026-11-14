/**
 * Studio → auth /account handoff.
 *
 * Cross-origin hard navigations are not helped by fetch()-prefetching the
 * HTML/session (separate cache, CORS, steals bandwidth). What actually helps:
 * warm the TLS connection early (preconnect), then assign immediately on click.
 */

import { getPersonalSettings } from "@hosanna/auth";
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

export type NavigateToAuthAccountOptions = {
  returnUrl?: string;
  /** Auth-app path. Defaults to `/account`. */
  path?: string;
};

/**
 * Navigate to an auth account path immediately.
 * No overlay, view-transition, or competing prefetch on the click path.
 */
export function navigateToAuthAccount(options?: NavigateToAuthAccountOptions): void {
  const returnUrl =
    options?.returnUrl ?? (typeof window !== "undefined" ? window.location.href : undefined);
  const path = options?.path?.trim() || "/account";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = authAppHref(normalized, { returnUrl });

  writeThemeCookie(getPersonalSettings().theme);
  // Best-effort connection warm if idle prefetch never ran — still non-blocking.
  prefetchAuthAccount();
  window.location.assign(url);
}

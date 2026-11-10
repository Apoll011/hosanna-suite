/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auth app origin (Better Auth UI + `/api/auth`).
 * Never falls back to the API host — session/org calls must hit auth.
 */
export function getAuthAppUrl(): string {
  const fromEnv = import.meta.env.VITE_AUTH_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://localhost:5174";
  return "https://auth.hosanna.live";
}

/** Build an auth-app URL, preserving query and optional returnUrl. */
export function authAppHref(
  path: string,
  options?: { returnUrl?: string; preserveSearch?: boolean },
): string {
  const base = getAuthAppUrl();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, `${base}/`);
  if (options?.preserveSearch && typeof window !== "undefined") {
    const current = new URLSearchParams(window.location.search);
    current.forEach((value, key) => {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    });
  }
  if (options?.returnUrl) {
    url.searchParams.set("returnUrl", options.returnUrl);
  }
  return url.toString();
}

/** Hard-navigate to the auth app (external origin). */
export function redirectToAuthApp(
  path: string,
  options?: { returnUrl?: string; preserveSearch?: boolean },
): void {
  window.location.replace(authAppHref(path, options));
}

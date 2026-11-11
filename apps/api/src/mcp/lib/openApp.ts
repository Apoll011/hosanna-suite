/**
 * Cross-app open directive for embedded Logos chat.
 * Hosts (Studio, Auth, future apps) resolve `app` → origin and open the URL.
 *
 * `app`:
 * - `"saas"` → apex marketing site (`hosanna.live`)
 * - any other slug → `{app}.hosanna.live` (e.g. `studio`, `auth`)
 */

export const OPEN_APP_TARGETS = ["same", "new"] as const;

export type OpenAppTarget = (typeof OPEN_APP_TARGETS)[number];

/** Known app ids today — new apps work without a catalog update (subdomain pattern). */
export const KNOWN_HOSANNA_APPS = ["saas", "studio", "auth"] as const;

export type KnownHosannaApp = (typeof KNOWN_HOSANNA_APPS)[number];

export function openAppDirective(opts: {
  app: string;
  path?: string;
  openIn?: OpenAppTarget;
  reason?: string;
}) {
  const app = opts.app.trim().toLowerCase() || "saas";
  const rawPath = (opts.path ?? "/").trim() || "/";
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const openIn: OpenAppTarget = opts.openIn === "new" ? "new" : "same";

  return {
    openApp: true as const,
    app,
    path,
    openIn,
    reason: opts.reason ?? "open_app",
    note: "The open Hosanna host will open this app URL (same tab or new tab).",
  };
}

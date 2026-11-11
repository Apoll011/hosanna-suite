/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Host capability model — every Hosanna web app that mounts Logos declares
 * what it can do locally. Tools that need more than the host provides are
 * routed to the owning app (usually Music/Studio) via `open_app`.
 */

/** Stable app ids used by `open_app` and host profiles. */
export type LogosAppId = string;

/**
 * What a host can perform without leaving the current tab.
 * Add new capabilities as products join the suite (Presenter, Planning, …).
 */
export type LogosCapability =
  /** Load/save songs via host adapter and/or LogosApi catalog methods. */
  | "catalog.songs"
  /** Load/save services via host adapter / API. */
  | "catalog.services"
  /** In-app song editor (Accept can hand off into the open editor). */
  | "editor.songs"
  /** In-app service editor. */
  | "editor.services"
  /** SPA navigation for library entities (studio_navigate). */
  | "navigate.local"
  /** Print / PDF modal (studio_generate_pdf). */
  | "print"
  /** Pull replication / refetch library (studio_sync). */
  | "library.sync";

export type LogosHostProfile = {
  /** Current app id (`studio`, `auth`, future `music` / `planning` / …). */
  appId: LogosAppId;
  capabilities: readonly LogosCapability[];
  /**
   * App that owns song editing when this host lacks `editor.songs`.
   * Defaults to `"studio"` until Music is split out.
   */
  musicAppId?: LogosAppId;
  /**
   * App that owns services/planning when this host lacks `editor.services`.
   * Defaults to `"studio"` until Planning owns services.
   */
  planningAppId?: LogosAppId;
};

export const DEFAULT_MUSIC_APP: LogosAppId = "studio";
export const DEFAULT_PLANNING_APP: LogosAppId = "studio";

export function hasCapability(
  profile: LogosHostProfile | null | undefined,
  capability: LogosCapability,
): boolean {
  return Boolean(profile?.capabilities?.includes(capability));
}

export function musicAppId(profile: LogosHostProfile | null | undefined): LogosAppId {
  return profile?.musicAppId?.trim() || DEFAULT_MUSIC_APP;
}

export function planningAppId(profile: LogosHostProfile | null | undefined): LogosAppId {
  return profile?.planningAppId?.trim() || DEFAULT_PLANNING_APP;
}

/** Studio / future Music — full library shell. */
export const STUDIO_HOST_PROFILE: LogosHostProfile = {
  appId: "studio",
  capabilities: [
    "catalog.songs",
    "catalog.services",
    "editor.songs",
    "editor.services",
    "navigate.local",
    "print",
    "library.sync",
  ],
  musicAppId: "studio",
  planningAppId: "studio",
};

/** Auth account center — catalog via API; hand off editing to Music. */
export const AUTH_HOST_PROFILE: LogosHostProfile = {
  appId: "auth",
  capabilities: ["catalog.songs", "catalog.services"],
  musicAppId: "studio",
  planningAppId: "studio",
};

/**
 * Minimal profile for future suite apps (Presenter companion, Finance, …)
 * until they declare their own capabilities. Catalog + open_app handoff only.
 */
export function thinHostProfile(
  appId: LogosAppId,
  opts?: Pick<LogosHostProfile, "musicAppId" | "planningAppId" | "capabilities">,
): LogosHostProfile {
  return {
    appId,
    capabilities: opts?.capabilities ?? ["catalog.songs", "catalog.services"],
    musicAppId: opts?.musicAppId ?? DEFAULT_MUSIC_APP,
    planningAppId: opts?.planningAppId ?? DEFAULT_PLANNING_APP,
  };
}

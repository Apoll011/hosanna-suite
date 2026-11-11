/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * What a mounting app can do locally. Everything else stays in chat
 * (proposals/confirms) or becomes an optional open card.
 */

export type LogosAppId = string;

export type LogosCapability =
  | "catalog.songs"
  | "catalog.services"
  | "editor.songs"
  | "editor.services"
  | "navigate.local"
  | "print"
  | "library.sync";

export type LogosHostProfile = {
  appId: LogosAppId;
  capabilities: readonly LogosCapability[];
  /** Owns song editing when this host lacks editor.songs (today: studio). */
  musicAppId?: LogosAppId;
  /** Owns services when this host lacks editor.services (today: studio). */
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

export const AUTH_HOST_PROFILE: LogosHostProfile = {
  appId: "auth",
  capabilities: ["catalog.songs", "catalog.services"],
  musicAppId: "studio",
  planningAppId: "studio",
};

/** Future suite apps: catalog + chat; optional open to Music/Planning. */
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

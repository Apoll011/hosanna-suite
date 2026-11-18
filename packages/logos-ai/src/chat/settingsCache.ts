/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiSettingsPublic } from "../types";

const VISIBILITY_KEY_PREFIX = "hosanna:ai-visible:";

const settingsByScope = new Map<string, AiSettingsPublic>();

export function isAiChatEnabled(settings: Pick<AiSettingsPublic, "configured" | "enabled">) {
  return settings.configured && settings.enabled;
}

function sessionStore(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function readCachedSettings(scope: string): AiSettingsPublic | null {
  return settingsByScope.get(scope) ?? null;
}

/** Only the on/off flag reaches sessionStorage; org instructions stay in memory. */
export function readCachedVisibility(scope: string): boolean | null {
  const raw = sessionStore()?.getItem(VISIBILITY_KEY_PREFIX + scope);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

export function writeCachedSettings(scope: string, settings: AiSettingsPublic): void {
  settingsByScope.set(scope, settings);
  try {
    sessionStore()?.setItem(VISIBILITY_KEY_PREFIX + scope, isAiChatEnabled(settings) ? "1" : "0");
  } catch {
    /* quota or privacy mode */
  }
}

export function resetAiSettingsCacheForTests(): void {
  settingsByScope.clear();
}

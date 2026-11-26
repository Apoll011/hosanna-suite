/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useSyncExternalStore } from "react";
import { aiContextBridge } from "../../core/bridge";

/** Key of the editor currently open (`song:<id>` / `service:<id>`), if any. */
function openEditorKey(): string {
  const song = aiContextBridge.getSong();
  if (song) return `song:${song.songId}`;
  const service = aiContextBridge.getService();
  if (service) return `service:${service.serviceId}`;
  return "";
}

export function useOpenEditorKey(): string {
  return useSyncExternalStore(aiContextBridge.subscribe, openEditorKey, openEditorKey);
}

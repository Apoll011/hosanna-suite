/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { AI_SETTINGS_CHANGED_EVENT } from "../../core/bridge";
import { useLogosHost } from "../../host";
import type { AiSettingsPublic } from "../../types";

export function useChatSettings() {
  const { api, canUseAi: canUse, scope } = useLogosHost();
  const [settings, setSettings] = useState<AiSettingsPublic | null>(null);

  const refreshSettings = useCallback(async () => {
    if (!canUse || !scope) {
      setSettings(null);
      return;
    }
    try {
      setSettings(await api.getSettings());
    } catch {
      setSettings(null);
    }
  }, [canUse, scope, api]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const onChanged = () => void refreshSettings();
    window.addEventListener(AI_SETTINGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(AI_SETTINGS_CHANGED_EVENT, onChanged);
  }, [refreshSettings]);

  const visible = Boolean(canUse && settings?.configured && settings?.enabled);

  return { settings, refreshSettings, canUse, visible };
}

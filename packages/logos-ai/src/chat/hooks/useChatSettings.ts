/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AI_SETTINGS_CHANGED_EVENT } from "../../core/bridge";
import { useLogosHost } from "../../host";
import type { AiSettingsPublic } from "../../types";
import {
  isAiChatEnabled,
  readCachedSettings,
  readCachedVisibility,
  writeCachedSettings,
} from "../settingsCache";

export function useChatSettings() {
  const { api, canUseAi: canUse, scope } = useLogosHost();
  const activeScope = canUse && scope ? scope : null;
  const [settings, setSettings] = useState<AiSettingsPublic | null>(() =>
    activeScope ? readCachedSettings(activeScope) : null,
  );
  const [cachedVisible, setCachedVisible] = useState<boolean | null>(() =>
    activeScope ? readCachedVisibility(activeScope) : null,
  );
  const scopeRef = useRef(activeScope);
  scopeRef.current = activeScope;

  const refreshSettings = useCallback(async () => {
    if (!activeScope) {
      setSettings(null);
      return;
    }
    try {
      const next = await api.getSettings();
      writeCachedSettings(activeScope, next);
      if (scopeRef.current === activeScope) setSettings(next);
    } catch {
      if (scopeRef.current === activeScope) setSettings(readCachedSettings(activeScope));
    }
  }, [activeScope, api]);

  useEffect(() => {
    setSettings(activeScope ? readCachedSettings(activeScope) : null);
    setCachedVisible(activeScope ? readCachedVisibility(activeScope) : null);
    void refreshSettings();
  }, [activeScope, refreshSettings]);

  useEffect(() => {
    const onChanged = () => void refreshSettings();
    window.addEventListener(AI_SETTINGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(AI_SETTINGS_CHANGED_EVENT, onChanged);
  }, [refreshSettings]);

  const visible = Boolean(activeScope && (settings ? isAiChatEnabled(settings) : cachedVisible));

  return { settings, refreshSettings, canUse, visible };
}

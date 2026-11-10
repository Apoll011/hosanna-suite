/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react";
import type { AiChatContext, AiConfirmAction, AiSettingsPublic, AiUiMessage } from "./apiTypes";

export type LogosTranslate = (key: string, vars?: Record<string, string | number>) => string;
export type LogosTc = (key: string, count: number, vars?: Record<string, string | number>) => string;

export type LogosSong = {
  id: string;
  title: string;
  artist?: string;
  content: string;
  song_number?: number | null;
};

export type LogosServiceElement = {
  id: string;
  type: string;
  title?: string;
  songId?: string;
  content?: string;
  position?: number;
  notes?: string;
  passage?: string;
  duration?: number;
};

export type LogosApi = {
  getSettings: () => Promise<AiSettingsPublic>;
  streamChat: (body: {
    messages: AiUiMessage[];
    context?: AiChatContext;
    locale?: string;
    signal?: AbortSignal;
  }) => Promise<Response>;
  confirmAction: (body: AiConfirmAction) => Promise<{ confirmed: boolean }>;
};

export type LogosHost = {
  api: LogosApi;
  t: LogosTranslate;
  tc: LogosTc;
  language: string;
  locale: string;
  /** Display name for empty-state greeting */
  userName?: string | null;
  /** Scope key for thread persistence: `${orgId}:${userId}` or null */
  scope: string | null;
  /** URL prefix like `/slug` or `` */
  slugPrefix: string;
  /** Whether AI feature is allowed */
  canUseAi: boolean;
  canUpdateSong: boolean;
  /** Map pathname+slugPrefix → view name used by buildPageContext */
  deriveView: (pathname: string, slugPrefix: string) => string;
  /** Load a song by id; return null if missing. Used by proposal UI. */
  useSong: (id: string | null | undefined) => {
    data: LogosSong | null | undefined;
    isLoading: boolean;
  };
  /** Persist song updates from proposals */
  useUpdateSong: () => (args: { id: string; data: Partial<LogosSong> }) => Promise<void>;
};

const LogosHostCtx = createContext<LogosHost | null>(null);

export function LogosHostProvider({
  value,
  children,
}: {
  value: LogosHost;
  children: React.ReactNode;
}) {
  return <LogosHostCtx.Provider value={value}>{children}</LogosHostCtx.Provider>;
}

export function useLogosHost(): LogosHost {
  const host = useContext(LogosHostCtx);
  if (!host) {
    throw new Error("useLogosHost must be used within LogosHostProvider");
  }
  return host;
}

export function useLogosI18n(): {
  t: LogosTranslate;
  tc: LogosTc;
  language: string;
  locale: string;
} {
  const { t, tc, language, locale } = useLogosHost();
  return { t, tc, language, locale };
}

export function useHostSong(id: string | null | undefined) {
  return useLogosHost().useSong(id);
}

export function useHostUpdateSong() {
  return useLogosHost().useUpdateSong();
}

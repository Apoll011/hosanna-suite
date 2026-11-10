/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiChatContext, AiConfirmAction, AiSettingsPublic, AiUiMessage } from "../types/api";

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

/** Core host — no React hooks. Song load/save lives on LogosSongAdapter. */
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
};

/** Separate adapter for proposal UI song load/save. */
export type LogosSongAdapter = {
  useSong: (id: string | null | undefined) => {
    data: LogosSong | null | undefined;
    isLoading: boolean;
  };
  useUpdateSong: () => (args: { id: string; data: Partial<LogosSong> }) => Promise<void>;
};

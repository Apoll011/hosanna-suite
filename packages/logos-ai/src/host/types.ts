/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiChatContext, AiConfirmAction, AiSettingsPublic, AiUiMessage } from "../types/api";
import type { LogosHostProfile } from "./capabilities";

export type LogosTranslate = (key: string, vars?: Record<string, string | number>) => string;
export type LogosTc = (
  key: string,
  count: number,
  vars?: Record<string, string | number>,
) => string;

export type LogosSong = {
  id: string;
  title: string;
  artist?: string;
  content: string;
  song_number?: number | null;
  /** ISO concurrency token when known (API updates). */
  updatedAt?: string;
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

export type LogosService = {
  id: string;
  name: string;
  date?: string;
  notes?: string | null;
  elements: LogosServiceElement[];
  /** ISO concurrency token when known (API updates). */
  updatedAt?: string;
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
  /**
   * Cross-host song catalog (auth, future apps). When set, proposal cards can
   * load/diff/accept without a Studio song adapter.
   */
  getSong?: (id: string) => Promise<LogosSong | null>;
  updateSong?: (id: string, data: Partial<LogosSong>) => Promise<LogosSong | void>;
  /** Cross-host service catalog for in-chat Accept on thin hosts. */
  getService?: (id: string) => Promise<LogosService | null>;
  updateService?: (
    id: string,
    data: Partial<Pick<LogosService, "name" | "notes" | "elements" | "updatedAt">>,
  ) => Promise<LogosService | void>;
};

/** Core host — no React hooks. Song load/save lives on LogosSongAdapter + optional API catalog. */
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
  /** Persist service proposals from chat (API catalog). Defaults false when omitted. */
  canUpdateService?: boolean;
  /** Map pathname+slugPrefix → view name used by buildPageContext */
  deriveView: (pathname: string, slugPrefix: string) => string;
  /**
   * Declares which local capabilities this app has. Missing / empty → treat as
   * thin host (catalog + chat proposals; optional open_app).
   */
  profile: LogosHostProfile;
};

/** Separate adapter for proposal UI song load/save. */
export type LogosSongAdapter = {
  useSong: (id: string | null | undefined) => {
    data: LogosSong | null | undefined;
    isLoading: boolean;
  };
  useUpdateSong: () => (args: { id: string; data: Partial<LogosSong> }) => Promise<void>;
};

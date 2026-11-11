/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LogosHost — the only thing a suite app must provide to mount chat.
 */

import type { LogosCatalog } from "../catalog/types";
import type { AiChatContext, AiConfirmAction, AiSettingsPublic, AiUiMessage } from "../types/api";
import type { LogosHostProfile } from "./capabilities";

export type LogosTranslate = (key: string, vars?: Record<string, string | number>) => string;
export type LogosTc = (
  key: string,
  count: number,
  vars?: Record<string, string | number>,
) => string;

/** Chat transport — same for every app. */
export type LogosChatApi = {
  getSettings: () => Promise<AiSettingsPublic>;
  streamChat: (body: {
    messages: AiUiMessage[];
    context?: AiChatContext;
    locale?: string;
    signal?: AbortSignal;
  }) => Promise<Response>;
  confirmAction: (body: AiConfirmAction) => Promise<{ confirmed: boolean }>;
};

/**
 * Combined API surface used inside the package.
 * Catalog methods are optional mirrors of LogosCatalog for backward-compatible hooks.
 */
export type LogosApi = LogosChatApi & {
  getSong?: (id: string) => Promise<import("../catalog/types").CatalogSong | null>;
  updateSong?: (
    id: string,
    data: import("../catalog/types").CatalogSongPatch,
  ) => Promise<import("../catalog/types").CatalogSong | void>;
  getService?: (id: string) => Promise<import("../catalog/types").CatalogService | null>;
  updateService?: (
    id: string,
    data: import("../catalog/types").CatalogServicePatch,
  ) => Promise<import("../catalog/types").CatalogService | void>;
};

export type LogosHost = {
  api: LogosApi;
  /** Shared catalog — preferred path for proposals. */
  catalog: LogosCatalog;
  t: LogosTranslate;
  tc: LogosTc;
  language: string;
  locale: string;
  userName?: string | null;
  scope: string | null;
  slugPrefix: string;
  canUseAi: boolean;
  /** @deprecated use catalog.canUpdate('song') */
  canUpdateSong: boolean;
  /** @deprecated use catalog.canUpdate('service') */
  canUpdateService?: boolean;
  deriveView: (pathname: string, slugPrefix: string) => string;
  profile: LogosHostProfile;
};

/** Legacy song React adapter (Studio RxDB). Optional. */
export type LogosSongAdapter = {
  useSong: (id: string | null | undefined) => {
    data: import("../catalog/types").CatalogSong | null | undefined;
    isLoading: boolean;
  };
  useUpdateSong: () => (
    args: { id: string; data: import("../catalog/types").CatalogSongPatch },
  ) => Promise<void>;
};

export type CreateLogosHostInput = {
  profile: LogosHostProfile;
  catalog: LogosCatalog;
  chat: LogosChatApi;
  t: LogosTranslate;
  tc: LogosTc;
  language: string;
  locale: string;
  userName?: string | null;
  scope: string | null;
  slugPrefix: string;
  canUseAi: boolean;
  deriveView: (pathname: string, slugPrefix: string) => string;
};

/**
 * One factory for every suite app. Catalog + chat + profile — done.
 */
export function createLogosHost(input: CreateLogosHostInput): LogosHost {
  const { catalog, chat } = input;
  return {
    api: {
      ...chat,
      getSong: (id) => catalog.get("song", id),
      updateSong: async (id, data) => {
        await catalog.update("song", id, data);
      },
      getService: (id) => catalog.get("service", id),
      updateService: async (id, data) => {
        await catalog.update("service", id, data);
      },
    },
    catalog,
    t: input.t,
    tc: input.tc,
    language: input.language,
    locale: input.locale,
    userName: input.userName,
    scope: input.scope,
    slugPrefix: input.slugPrefix,
    canUseAi: input.canUseAi,
    canUpdateSong: catalog.canUpdate("song"),
    canUpdateService: catalog.canUpdate("service"),
    deriveView: input.deriveView,
    profile: input.profile,
  };
}

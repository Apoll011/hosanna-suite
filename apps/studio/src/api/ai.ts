/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Studio AI client surface used by Logos chat. Org AI admin (keys, memory,
 * billing) lives on auth-app — those APIs are not called from Studio UI.
 */

import { unwrapApiResult } from "./client";
import { getApiClient } from "./http";

export type AiProvider = "openai" | "anthropic" | "google" | "deepseek" | "openai_compatible";

export type AiSettingsPublic = {
  provider: AiProvider;
  model: string;
  enabled: boolean;
  configured: boolean;
  baseUrl: string | null;
  encryptionReady: boolean;
  maxToolCalls: number;
  temperature: number | null;
  maxOutputTokens: number | null;
  instructions: string;
  memoryEnabled: boolean;
  limits: {
    maxToolCalls: { min: number; max: number; default: number };
    temperature: { min: number; max: number };
    maxOutputTokens: { min: number; max: number };
    instructionsMaxChars: number;
    memoryMaxEntries: number;
    memoryEntryMaxChars: number;
  };
  providers: AiProvider[];
  modelPresets: Record<AiProvider, string[]>;
  defaultBaseUrls?: Partial<Record<AiProvider, string>>;
};

export type AiChatContext = {
  kind?:
    | "song_editor"
    | "service_editor"
    | "songs_list"
    | "services_list"
    | "explorer"
    | "collection_detail"
    | "agenda"
    | "trash"
    | "general";
  route?: string;
  songId?: string;
  serviceId?: string;
  folderId?: string | null;
  collectionId?: string | null;
  title?: string;
  updatedAt?: string;
  artist?: string;
  contentExcerpt?: string;
  contentTruncated?: boolean;
  selectedSongIds?: string[];
  selectedFolderIds?: string[];
  serviceElementsSummary?: Array<{
    id: string;
    type: string;
    title?: string;
    songId?: string;
  }>;
  hostApp?: string;
  hostCapabilities?: string[];
};

export type AiUiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: string; [key: string]: unknown }>;
};

export type AiConfirmAction = {
  action:
    | "delete_song"
    | "delete_service"
    | "delete_folder"
    | "delete_collection"
    | "delete_agenda";
  id: string;
  folderAction?: "move_to_root" | "delete_songs";
};

export const aiApi = {
  getSettings: async (): Promise<AiSettingsPublic> =>
    (await unwrapApiResult(await getApiClient().openapi.GET("/ai/settings"))) as AiSettingsPublic,

  confirmAction: async (body: AiConfirmAction): Promise<{ confirmed: boolean }> => {
    const data = await unwrapApiResult(
      await getApiClient().openapi.POST("/ai/confirm", {
        body,
      }),
    );
    return {
      confirmed: Boolean((data as { confirmed?: boolean })?.confirmed),
    };
  },

  streamChat: async (body: {
    messages: AiUiMessage[];
    context?: AiChatContext;
    locale?: string;
    signal?: AbortSignal;
  }): Promise<Response> => {
    const { data, error, response } = await getApiClient().openapi.POST("/ai/chat", {
      body: {
        messages: body.messages as { [key: string]: unknown }[],
        context: body.context as { [key: string]: unknown } | undefined,
        locale: body.locale as "pt" | "en" | "es" | undefined,
      },
      parseAs: "stream",
      signal: body.signal,
    });

    if (!response.ok) {
      await unwrapApiResult({ data, error, response });
    }

    return response;
  },
};

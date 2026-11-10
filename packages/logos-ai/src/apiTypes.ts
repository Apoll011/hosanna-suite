/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiProvider = "openai" | "anthropic" | "google" | "deepseek" | "openai_compatible";

export type NativeWebCapability = {
  search: boolean;
  fetch: boolean;
  note: string;
};

export type AiLimits = {
  maxToolCalls: { min: number; max: number; default: number };
  temperature: { min: number; max: number };
  maxOutputTokens: { min: number; max: number };
  instructionsMaxChars: number;
  memoryMaxEntries: number;
  memoryEntryMaxChars: number;
};

export type AiSettingsPublic = {
  provider: AiProvider;
  model: string;
  enabled: boolean;
  configured: boolean;
  baseUrl: string | null;
  encryptionReady: boolean;
  /** Max tool calls the assistant may make per reply. */
  maxToolCalls: number;
  /** null = model default. */
  temperature: number | null;
  /** null = model default. */
  maxOutputTokens: number | null;
  instructions: string;
  memoryEnabled: boolean;
  limits: AiLimits;
  providers: AiProvider[];
  modelPresets: Record<AiProvider, string[]>;
  defaultBaseUrls?: Partial<Record<AiProvider, string>>;
  /** All providers → whether Hosanna can call REST Search/Fetch with BYOK. */
  nativeWebCapabilities?: Record<AiProvider, NativeWebCapability>;
  /** Capability for the currently selected provider. */
  nativeWeb?: {
    search: boolean;
    fetch: boolean;
    note: string;
    active: boolean;
  };
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
  /** ISO updatedAt of the open song/service when known. */
  updatedAt?: string;
  artist?: string;
  contentExcerpt?: string;
  contentTruncated?: boolean;
  selectedSongIds?: string[];
  selectedFolderIds?: string[];
  /** Compact service element summary (ids/types/titles/songIds). */
  serviceElementsSummary?: Array<{
    id: string;
    type: string;
    title?: string;
    songId?: string;
  }>;
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

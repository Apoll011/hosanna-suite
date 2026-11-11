import {
  apiBaseUrl,
  ensureActiveOrganizationSession,
  readApiError,
  apiFetch,
} from "@/lib/services/api";
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

export type AiMemoryItem = {
  id: string;
  content: string;
  source: "admin" | "ai" | string;
  createdAt: string;
};

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
  limits: AiLimits;
  providers: AiProvider[];
  modelPresets: Record<AiProvider, string[]>;
  defaultBaseUrls?: Partial<Record<AiProvider, string>>;
  nativeWebCapabilities?: Record<AiProvider, NativeWebCapability>;
  nativeWeb?: {
    search: boolean;
    fetch: boolean;
    note: string;
    active: boolean;
  };
};

export type UpdateAiSettingsInput = {
  provider?: AiProvider;
  model?: string;
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string | null;
  maxToolCalls?: number;
  temperature?: number | null;
  maxOutputTokens?: number | null;
  instructions?: string | null;
  memoryEnabled?: boolean;
};

export type AiBalanceInfo = {
  currency: string;
  totalBalance: string;
  grantedBalance: string;
  toppedUpBalance: string;
};

export type AiBillingResponse =
  | {
      supported: true;
      provider: "deepseek";
      kind: "balance";
      isAvailable: boolean;
      balances: AiBalanceInfo[];
      fetchedAt: string;
    }
  | {
      supported: false;
      provider: AiProvider;
      reason: "unsupported_provider" | "not_configured" | "disabled_crypto";
    };

type OrgScoped = { organizationId: string };

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
  getSettings: ({ organizationId }: OrgScoped): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings", { organizationId }),

  updateSettings: (
    input: UpdateAiSettingsInput,
    { organizationId }: OrgScoped,
  ): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings", {
      method: "PUT",
      body: JSON.stringify(input),
      organizationId,
    }),

  clearKey: ({ organizationId }: OrgScoped): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings/key", {
      method: "DELETE",
      organizationId,
    }),

  getBilling: ({ organizationId }: OrgScoped): Promise<AiBillingResponse> =>
    apiFetch<AiBillingResponse>("/ai/billing", { organizationId }),

  listMemory: async ({ organizationId }: OrgScoped): Promise<{ items: AiMemoryItem[] }> => {
    const data = await apiFetch<{ items?: AiMemoryItem[] }>("/ai/memory", { organizationId });
    return { items: data?.items ?? [] };
  },

  addMemory: (content: string, { organizationId }: OrgScoped): Promise<AiMemoryItem> =>
    apiFetch<AiMemoryItem>("/ai/memory", {
      method: "POST",
      body: JSON.stringify({ content }),
      organizationId,
    }),

  removeMemory: (id: string, { organizationId }: OrgScoped): Promise<void> =>
    apiFetch<void>(`/ai/memory/${encodeURIComponent(id)}`, {
      method: "DELETE",
      organizationId,
    }),

  clearMemory: async ({ organizationId }: OrgScoped): Promise<{ cleared: number }> => {
    const data = await apiFetch<{ cleared?: number }>("/ai/memory", {
      method: "DELETE",
      organizationId,
    });
    return { cleared: data?.cleared ?? 0 };
  },

  listPersonalMemory: async ({ organizationId }: OrgScoped): Promise<{ items: AiMemoryItem[] }> => {
    const data = await apiFetch<{ items?: AiMemoryItem[] }>("/ai/memory/personal", {
      organizationId,
    });
    return { items: data?.items ?? [] };
  },

  addPersonalMemory: (content: string, { organizationId }: OrgScoped): Promise<AiMemoryItem> =>
    apiFetch<AiMemoryItem>("/ai/memory/personal", {
      method: "POST",
      body: JSON.stringify({ content }),
      organizationId,
    }),

  removePersonalMemory: (id: string, { organizationId }: OrgScoped): Promise<void> =>
    apiFetch<void>(`/ai/memory/personal/${encodeURIComponent(id)}`, {
      method: "DELETE",
      organizationId,
    }),

  clearPersonalMemory: async ({ organizationId }: OrgScoped): Promise<{ cleared: number }> => {
    const data = await apiFetch<{ cleared?: number }>("/ai/memory/personal", {
      method: "DELETE",
      organizationId,
    });
    return { cleared: data?.cleared ?? 0 };
  },

  confirmAction: (
    body: AiConfirmAction,
    { organizationId }: OrgScoped,
  ): Promise<{ confirmed: boolean }> =>
    apiFetch<{ confirmed: boolean }>("/ai/confirm", {
      method: "POST",
      body: JSON.stringify(body),
      organizationId,
    }),

  streamChat: async (
    body: {
      messages: AiUiMessage[];
      context?: AiChatContext;
      locale?: string;
      signal?: AbortSignal;
    },
    { organizationId }: OrgScoped,
  ): Promise<Response> => {
    await ensureActiveOrganizationSession(organizationId);
    const res = await fetch(`${apiBaseUrl()}/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "text/event-stream, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: body.messages,
        context: body.context,
        locale: body.locale,
      }),
      signal: body.signal,
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res;
  },
};

import { apiFetch } from "@/lib/hosanna-api";

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

export const aiApi = {
  getSettings: (): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings"),

  updateSettings: (input: UpdateAiSettingsInput): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings", {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  clearKey: (): Promise<AiSettingsPublic> =>
    apiFetch<AiSettingsPublic>("/ai/settings/key", { method: "DELETE" }),

  getBilling: (): Promise<AiBillingResponse> =>
    apiFetch<AiBillingResponse>("/ai/billing"),

  listMemory: async (): Promise<{ items: AiMemoryItem[] }> => {
    const data = await apiFetch<{ items?: AiMemoryItem[] }>("/ai/memory");
    return { items: data?.items ?? [] };
  },

  addMemory: (content: string): Promise<AiMemoryItem> =>
    apiFetch<AiMemoryItem>("/ai/memory", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  removeMemory: (id: string): Promise<void> =>
    apiFetch<void>(`/ai/memory/${encodeURIComponent(id)}`, { method: "DELETE" }),

  clearMemory: async (): Promise<{ cleared: number }> => {
    const data = await apiFetch<{ cleared?: number }>("/ai/memory", { method: "DELETE" });
    return { cleared: data?.cleared ?? 0 };
  },

  listPersonalMemory: async (): Promise<{ items: AiMemoryItem[] }> => {
    const data = await apiFetch<{ items?: AiMemoryItem[] }>("/ai/memory/personal");
    return { items: data?.items ?? [] };
  },

  addPersonalMemory: (content: string): Promise<AiMemoryItem> =>
    apiFetch<AiMemoryItem>("/ai/memory/personal", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  removePersonalMemory: (id: string): Promise<void> =>
    apiFetch<void>(`/ai/memory/personal/${encodeURIComponent(id)}`, { method: "DELETE" }),

  clearPersonalMemory: async (): Promise<{ cleared: number }> => {
    const data = await apiFetch<{ cleared?: number }>("/ai/memory/personal", {
      method: "DELETE",
    });
    return { cleared: data?.cleared ?? 0 };
  },
};

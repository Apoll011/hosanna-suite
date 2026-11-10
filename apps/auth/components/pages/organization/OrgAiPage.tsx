"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { AiProviderLogoBadge } from "@/components/organization/AiProviderLogo";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import {
  aiApi,
  type AiBillingResponse,
  type AiLimits,
  type AiMemoryItem,
  type AiProvider,
  type AiSettingsPublic,
} from "@/lib/ai-api";
import { useI18n } from "@/lib/i18n";
import { Button, PageHeader, Spinner, Surface } from "@hosanna/ui";
import {
  Brain,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  Gift,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const inputClass =
  "w-full rounded-md border border-m3-border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary disabled:opacity-60 disabled:bg-m3-sidebar transition-colors";

const selectClass = `${inputClass} cursor-pointer`;

const API_KEY_MASK = "••••••••••••••••••••••••";

const PROVIDER_META: Record<
  AiProvider,
  { label: string; hint: string; usesDefaultEndpoint: boolean }
> = {
  openai: { label: "ChatGPT", hint: "OpenAI GPT models", usesDefaultEndpoint: true },
  anthropic: { label: "Anthropic", hint: "Claude models", usesDefaultEndpoint: true },
  google: { label: "Gemini", hint: "Google AI", usesDefaultEndpoint: true },
  deepseek: { label: "DeepSeek", hint: "Search + fetch", usesDefaultEndpoint: true },
  openai_compatible: {
    label: "Custom",
    hint: "Your own endpoint",
    usesDefaultEndpoint: false,
  },
};

function SectionCard({
  title,
  desc,
  icon,
  action,
  children,
}: {
  title: string;
  desc?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface className="space-y-5 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-m3-text">{title}</h3>
            {desc ? <p className="text-xs text-m3-secondary mt-0.5">{desc}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Surface>
  );
}

function formatMoney(amount: string, currency: string): string {
  const symbol = currency === "CNY" ? "¥" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${amount}`;
}

function formatFetchedAt(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AiBillingCard({
  refreshKey,
  showToast,
}: {
  refreshKey: number;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<AiBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await aiApi.getBilling());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("ai.settings.billing.loadError");
      setError(message);
      setData(null);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  let body: ReactNode = null;
  if (loading && !data) {
    body = (
      <div className="flex justify-center py-8">
        <Spinner size="sm" label={t("ai.settings.billing.loading")} />
      </div>
    );
  } else if (error) {
    body = <p className="text-sm text-m3-danger">{error}</p>;
  } else if (data?.supported === false) {
    const reasonMsg =
      data.reason === "not_configured"
        ? t("ai.settings.billing.notConfigured")
        : data.reason === "disabled_crypto"
          ? t("ai.settings.billing.cryptoMissing")
          : t("ai.settings.billing.unsupported");
    body = <p className="text-sm text-m3-secondary text-center py-4">{reasonMsg}</p>;
  } else if (data?.supported === true && data.kind === "balance") {
    const primary = data.balances[0];
    body = (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-lg border border-m3-border bg-m3-sidebar/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-m3-secondary">{t("ai.settings.billing.total")}</p>
                <p className="text-2xl font-semibold tabular-nums text-m3-text mt-1">
                  {primary ? formatMoney(primary.totalBalance, primary.currency) : "—"}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  data.isAvailable
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                }`}
              >
                {data.isAvailable
                  ? t("ai.settings.billing.available")
                  : t("ai.settings.billing.unavailable")}
              </span>
            </div>
          </div>
          {primary ? (
            <div className="grid grid-cols-2 sm:grid-cols-1 sm:w-48 gap-2 shrink-0">
              <div className="rounded-lg border border-m3-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-xs text-m3-secondary">{t("ai.settings.billing.granted")}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(primary.grantedBalance, primary.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-m3-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-sky-600" />
                  <p className="text-xs text-m3-secondary">{t("ai.settings.billing.toppedUp")}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(primary.toppedUpBalance, primary.currency)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-m3-secondary">
          {t("ai.settings.billing.refreshedAt", {
            time: formatFetchedAt(data.fetchedAt, locale),
          })}
        </p>
      </div>
    );
  }

  return (
    <SectionCard
      icon={<Wallet className="w-4 h-4" />}
      title={t("ai.settings.billing.title")}
      desc={t("ai.settings.billing.desc")}
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("ai.settings.billing.refresh")}
          isLoading={loading}
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void load()}
          disabled={loading}
        />
      }
    >
      {body}
    </SectionCard>
  );
}

function AiMemoryPanel({
  scope,
  limits,
  showToast,
}: {
  scope: "organization" | "personal";
  limits: AiLimits;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const { t } = useI18n();
  const [items, setItems] = useState<AiMemoryItem[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const isOrg = scope === "organization";

  const api = isOrg
    ? {
        list: aiApi.listMemory,
        add: aiApi.addMemory,
        remove: aiApi.removeMemory,
        clear: aiApi.clearMemory,
      }
    : {
        list: aiApi.listPersonalMemory,
        add: aiApi.addPersonalMemory,
        remove: aiApi.removePersonalMemory,
        clear: aiApi.clearPersonalMemory,
      };

  const fail = useCallback(
    (err: unknown) => {
      showToast(err instanceof Error ? err.message : t("ai.settings.memoryError"), "error");
    },
    [showToast, t],
  );

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    void api
      .list()
      .then((r) => {
        if (!cancelled) setItems(r.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setItems([]);
          fail(err);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on scope change only
  }, [scope, fail]);

  const add = async () => {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      const item = await api.add(content);
      setItems((prev) => (prev?.some((p) => p.id === item.id) ? prev : [...(prev ?? []), item]));
      setDraft("");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await api.remove(id);
      setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await api.clear();
      setItems([]);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const count = items?.length ?? 0;
  const full = count >= limits.memoryMaxEntries;
  const Icon = isOrg ? Building2 : User;

  return (
    <Surface className="space-y-4 h-full">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-m3-text">
            {isOrg ? t("ai.settings.memoryOrgTitle") : t("ai.settings.memoryPersonalTitle")}
          </h3>
          <p className="text-xs text-m3-secondary mt-0.5">
            {isOrg ? t("ai.settings.memoryOrgDesc") : t("ai.settings.memoryPersonalDesc")}
          </p>
        </div>
        <span className="text-xs text-m3-secondary tabular-nums shrink-0">
          {t("ai.settings.memoryCount", { count, max: limits.memoryMaxEntries })}
        </span>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input
          className={`${inputClass} flex-1 min-w-0`}
          value={draft}
          maxLength={limits.memoryEntryMaxChars}
          disabled={busy || full}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder={
            isOrg
              ? t("ai.settings.memoryOrgPlaceholder")
              : t("ai.settings.memoryPersonalPlaceholder")
          }
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="shrink-0"
          icon={<Plus className="w-4 h-4" />}
          disabled={busy || full || !draft.trim()}
        >
          {t("ai.settings.memoryAdd")}
        </Button>
      </form>

      {items === null ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-m3-border py-8 px-4 text-center">
          <Brain className="w-5 h-5 text-m3-secondary/60" />
          <p className="text-sm text-m3-secondary m-0">{t("ai.settings.memoryEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <ul className="m-0 p-0 list-none rounded-lg border border-m3-border divide-y divide-m3-border overflow-hidden">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 px-3 py-2.5 bg-m3-card hover:bg-m3-sidebar/50 transition-colors"
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.source === "ai"
                      ? "bg-m3-primary/10 text-m3-primary"
                      : "bg-m3-sidebar text-m3-secondary"
                  }`}
                  title={
                    item.source === "ai"
                      ? t("ai.settings.memorySourceAi")
                      : isOrg
                        ? t("ai.settings.memorySourceAdmin")
                        : t("ai.settings.memorySourceUser")
                  }
                >
                  {item.source === "ai" ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                </span>
                <span className="flex-1 min-w-0 text-sm text-m3-text wrap-break-word">
                  {item.content}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(item.id)}
                  title={t("ai.settings.memoryDelete")}
                  aria-label={t("ai.settings.memoryDelete")}
                  className="shrink-0 p-1.5 rounded-sm text-m3-secondary opacity-60 group-hover:opacity-100 hover:text-red-600 hover:bg-red-500/10 disabled:opacity-40 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => void clear()}
              className="text-xs text-m3-secondary hover:text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
            >
              {t("ai.settings.memoryClear")}
            </button>
          </div>
        </div>
      )}
    </Surface>
  );
}

export function OrgAiPage() {
  const { t } = useI18n();
  const { organization, capabilities, isLoading: orgLoading } = useActiveOrganization();

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [settings, setSettings] = useState<AiSettingsPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [provider, setProvider] = useState<AiProvider>("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [customModel, setCustomModel] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyEditing, setApiKeyEditing] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [maxToolCalls, setMaxToolCalls] = useState(12);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [maxOutputTokens, setMaxOutputTokens] = useState("");
  const [instructions, setInstructions] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [billingRefreshKey, setBillingRefreshKey] = useState(0);

  const canManage = capabilities.canManageAi;

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!canManage || !organization) return;
    let cancelled = false;
    setLoading(true);
    void aiApi
      .getSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setProvider(data.provider);
        setModel(data.model);
        setEnabled(data.enabled);
        setBaseUrl(data.provider === "openai_compatible" ? (data.baseUrl ?? "") : "");
        setMaxToolCalls(data.maxToolCalls);
        setTemperature(data.temperature);
        setMaxOutputTokens(data.maxOutputTokens != null ? String(data.maxOutputTokens) : "");
        setInstructions(data.instructions ?? "");
        setMemoryEnabled(data.memoryEnabled);
        setApiKey("");
        setApiKeyEditing(false);
        const presets = data.modelPresets[data.provider] ?? [];
        setCustomModel(!presets.includes(data.model));
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : t("ai.settings.loadError");
        showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, organization, showToast, t]);

  const presets = useMemo(() => settings?.modelPresets[provider] ?? [], [settings, provider]);

  if (orgLoading) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!organization) {
    return (
      <AccountCenter>
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.noOrganization")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  if (!canManage) {
    return (
      <AccountCenter>
        <PageHeader
          title={t("accountOrg.ai.title")}
          description={t("accountOrg.ai.description")}
        />
        <Surface className="text-center py-10">
          <Lock className="w-5 h-5 text-m3-secondary mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-m3-text">{t("ai.settings.noAccessTitle")}</h3>
          <p className="text-sm text-m3-secondary mt-1">{t("ai.settings.noAccessDesc")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  const handleProviderChange = (next: AiProvider) => {
    setProvider(next);
    const nextPresets = settings?.modelPresets[next] ?? [];
    if (nextPresets.length > 0 && !customModel) {
      setModel(nextPresets[0]!);
    }
    if (next === "openai_compatible") {
      setBaseUrl(settings?.baseUrl ?? settings?.defaultBaseUrls?.[next] ?? "");
    } else {
      setBaseUrl("");
    }
  };

  const isCustomProvider = provider === "openai_compatible";

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await aiApi.updateSettings({
        provider,
        model: model.trim(),
        enabled,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        ...(isCustomProvider ? { baseUrl: baseUrl.trim() || null } : { baseUrl: null }),
        maxToolCalls,
        temperature,
        maxOutputTokens: maxOutputTokens.trim() ? Number(maxOutputTokens.trim()) : null,
        instructions: instructions.trim() || null,
        memoryEnabled,
      });
      setSettings(data);
      setApiKey("");
      setApiKeyEditing(false);
      setBaseUrl(data.provider === "openai_compatible" ? (data.baseUrl ?? "") : "");
      setBillingRefreshKey((k) => k + 1);
      showToast(t("ai.settings.saved"), "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("ai.settings.saveError");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearKey = async () => {
    setClearing(true);
    try {
      const data = await aiApi.clearKey();
      setSettings(data);
      setEnabled(false);
      setApiKey("");
      setApiKeyEditing(false);
      showToast(t("ai.settings.keyCleared"), "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("ai.settings.saveError");
      showToast(message, "error");
    } finally {
      setClearing(false);
    }
  };

  const providers = settings?.providers ?? [];
  const ready = Boolean(settings?.configured && enabled);
  const showMaskedKey = Boolean(settings?.configured) && !apiKeyEditing;

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title={t("accountOrg.ai.title")}
            description={t("accountOrg.ai.description")}
          />
          {settings ? (
            <label className="flex items-center gap-3 shrink-0 self-start rounded-lg border border-m3-border px-3.5 py-2.5 cursor-pointer">
              <span className="text-sm font-medium text-m3-text">{t("ai.settings.enabled")}</span>
              <input
                type="checkbox"
                className="w-4 h-4 accent-m3-primary"
                checked={enabled}
                disabled={!settings.configured && !apiKey.trim()}
                onChange={(e) => setEnabled(e.currentTarget.checked)}
              />
            </label>
          ) : null}
        </div>

        {settings ? (
          <div className="flex flex-wrap items-center gap-2">
            {ready ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("ai.settings.statusOn")}
              </span>
            ) : settings.configured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                <CircleOff className="w-3.5 h-3.5" />
                {t("ai.settings.statusPaused")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-m3-sidebar text-m3-secondary border border-m3-border">
                <KeyRound className="w-3.5 h-3.5" />
                {t("ai.settings.statusSetup")}
              </span>
            )}
            {settings.configured ? (
              <span className="text-xs text-m3-secondary">
                {PROVIDER_META[settings.provider]?.label ?? settings.provider} · {settings.model}
              </span>
            ) : null}
          </div>
        ) : null}

        {loading || !settings ? (
          <div className="flex justify-center py-16">
            <Spinner size="md" label={t("ai.settings.loading")} />
          </div>
        ) : (
          <>
            {!settings.encryptionReady ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                {t("ai.settings.encryptionMissing")}
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionCard
                icon={<Zap className="w-4 h-4" />}
                title={t("ai.settings.connectionTitle")}
                desc={t("ai.settings.connectionDesc")}
              >
                <div>
                  <span className="text-xs font-medium text-m3-text block mb-2">
                    {t("ai.settings.provider")}
                  </span>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label={t("ai.settings.provider")}
                  >
                    {providers.map((p) => {
                      const meta = PROVIDER_META[p];
                      const selected = provider === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => handleProviderChange(p)}
                          className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                            selected
                              ? "border-m3-primary bg-m3-primary/5"
                              : "border-m3-border hover:border-m3-primary/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AiProviderLogoBadge provider={p} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`block text-sm font-semibold truncate ${
                                    selected ? "text-m3-primary" : "text-m3-text"
                                  }`}
                                >
                                  {meta.label}
                                </span>
                                {selected ? (
                                  <Check className="w-3.5 h-3.5 text-m3-primary shrink-0" />
                                ) : null}
                              </span>
                              <span className="block text-xs text-m3-secondary mt-0.5">
                                {meta.hint}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-m3-secondary mt-2">
                    {settings.nativeWebCapabilities?.[provider]?.search
                      ? t("ai.settings.nativeWebOn")
                      : t("ai.settings.nativeWebOff")}
                  </p>
                </div>

                {isCustomProvider ? (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-m3-text">
                      {t("ai.settings.baseUrl")}
                    </span>
                    <input
                      className={inputClass}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.currentTarget.value)}
                      placeholder={t("ai.settings.baseUrlRequiredPlaceholder")}
                      required
                    />
                    <span className="text-xs text-m3-secondary">{t("ai.settings.baseUrlHint")}</span>
                  </label>
                ) : null}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-m3-text">{t("ai.settings.model")}</span>
                    <button
                      type="button"
                      className="text-xs text-m3-primary hover:underline cursor-pointer"
                      onClick={() => setCustomModel((v) => !v)}
                    >
                      {customModel ? t("ai.settings.usePresets") : t("ai.settings.customModel")}
                    </button>
                  </div>
                  {customModel ? (
                    <input
                      className={inputClass}
                      value={model}
                      onChange={(e) => setModel(e.currentTarget.value)}
                      placeholder={t("ai.settings.modelPlaceholder")}
                    />
                  ) : (
                    <select
                      className={selectClass}
                      value={model}
                      onChange={(e) => setModel(e.currentTarget.value)}
                    >
                      {presets.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      {!presets.includes(model) && model ? (
                        <option value={model}>{model}</option>
                      ) : null}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-m3-text flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5" />
                      {t("ai.settings.apiKey")}
                    </span>
                    {settings.configured ? (
                      <button
                        type="button"
                        className="text-xs text-m3-danger hover:underline cursor-pointer disabled:opacity-50"
                        disabled={clearing || saving}
                        onClick={() => void handleClearKey()}
                      >
                        {t("ai.settings.clearKey")}
                      </button>
                    ) : null}
                  </div>
                  <input
                    className={`${inputClass} ${showMaskedKey ? "tracking-[0.18em] text-m3-secondary" : "font-mono"}`}
                    type={showMaskedKey ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    readOnly={showMaskedKey}
                    value={showMaskedKey ? API_KEY_MASK : apiKey}
                    onFocus={() => {
                      if (showMaskedKey) {
                        setApiKeyEditing(true);
                        setApiKey("");
                      }
                    }}
                    onChange={(e) => {
                      setApiKeyEditing(true);
                      setApiKey(e.currentTarget.value);
                    }}
                    placeholder={
                      settings.configured
                        ? t("ai.settings.apiKeyConfiguredPlaceholder")
                        : t("ai.settings.apiKeyPlaceholder")
                    }
                  />
                  <span className="text-xs text-m3-secondary">
                    {settings.configured
                      ? t("ai.settings.apiKeyReplaceHint")
                      : t("ai.settings.keyStatusMissing")}{" "}
                    {t("ai.settings.keyNeverReturned")}
                  </span>
                </div>

                <div className="flex justify-end pt-1 border-t border-m3-border">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    icon={<Save className="w-4 h-4" />}
                    onClick={() => void handleSave()}
                    disabled={clearing || !model.trim() || (isCustomProvider && !baseUrl.trim())}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </SectionCard>

              <SectionCard
                icon={<Settings2 className="w-4 h-4" />}
                title={t("ai.settings.behaviorTitle")}
                desc={t("ai.settings.behaviorDesc")}
              >
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-m3-text">
                    {t("ai.settings.instructions")}
                  </span>
                  <textarea
                    className={`${inputClass} min-h-28 resize-y`}
                    value={instructions}
                    maxLength={settings.limits.instructionsMaxChars}
                    onChange={(e) => setInstructions(e.currentTarget.value)}
                    placeholder={t("ai.settings.instructionsPlaceholder")}
                  />
                  <span className="text-xs text-m3-secondary flex justify-between gap-2">
                    <span>{t("ai.settings.instructionsHint")}</span>
                    <span className="tabular-nums shrink-0">
                      {instructions.length}/{settings.limits.instructionsMaxChars}
                    </span>
                  </span>
                </label>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-m3-border px-3.5 py-3 cursor-pointer hover:bg-m3-sidebar/40 transition-colors">
                  <div>
                    <span className="text-sm font-medium text-m3-text block">
                      {t("ai.settings.memoryEnabled")}
                    </span>
                    <span className="text-xs text-m3-secondary">
                      {t("ai.settings.memoryEnabledDesc")}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-m3-primary"
                    checked={memoryEnabled}
                    onChange={(e) => setMemoryEnabled(e.currentTarget.checked)}
                  />
                </label>

                <div className="rounded-lg border border-m3-border overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left hover:bg-m3-sidebar/60 transition-colors cursor-pointer"
                    aria-expanded={showAdvanced}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    <span>
                      <span className="text-sm font-medium text-m3-text block">
                        {t("ai.settings.advanced")}
                      </span>
                      <span className="text-xs text-m3-secondary">
                        {t("ai.settings.advancedDesc")}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-m3-secondary shrink-0 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showAdvanced ? (
                    <div className="space-y-4 px-3.5 pb-4 pt-3 border-t border-m3-border bg-m3-sidebar/30">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-m3-text">
                            {t("ai.settings.maxToolCalls")}
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-m3-primary">
                            {maxToolCalls}
                          </span>
                        </div>
                        <input
                          type="range"
                          className="w-full accent-m3-primary"
                          min={settings.limits.maxToolCalls.min}
                          max={settings.limits.maxToolCalls.max}
                          step={1}
                          value={maxToolCalls}
                          onChange={(e) => setMaxToolCalls(Number(e.currentTarget.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-m3-text">
                            {t("ai.settings.temperature")}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-m3-primary">
                              {temperature == null
                                ? t("ai.settings.temperatureDefault")
                                : temperature.toFixed(1)}
                            </span>
                            {temperature != null ? (
                              <button
                                type="button"
                                className="text-xs text-m3-primary hover:underline cursor-pointer"
                                onClick={() => setTemperature(null)}
                              >
                                {t("ai.settings.temperatureDefault")}
                              </button>
                            ) : null}
                          </span>
                        </div>
                        <input
                          type="range"
                          className="w-full accent-m3-primary"
                          min={settings.limits.temperature.min}
                          max={settings.limits.temperature.max}
                          step={0.1}
                          value={temperature ?? 0.7}
                          onChange={(e) => setTemperature(Number(e.currentTarget.value))}
                        />
                      </div>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-m3-text">
                          {t("ai.settings.maxOutputTokens")}
                        </span>
                        <input
                          className={inputClass}
                          type="number"
                          inputMode="numeric"
                          min={settings.limits.maxOutputTokens.min}
                          max={settings.limits.maxOutputTokens.max}
                          value={maxOutputTokens}
                          onChange={(e) => setMaxOutputTokens(e.currentTarget.value)}
                          placeholder={t("ai.settings.temperatureDefault")}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end pt-1 border-t border-m3-border">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    icon={<Save className="w-4 h-4" />}
                    onClick={() => void handleSave()}
                    disabled={clearing || !model.trim() || (isCustomProvider && !baseUrl.trim())}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </SectionCard>
            </div>

            {settings.configured && settings.provider === "deepseek" && provider === "deepseek" ? (
              <AiBillingCard refreshKey={billingRefreshKey} showToast={showToast} />
            ) : null}

            {memoryEnabled ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AiMemoryPanel
                  scope="organization"
                  limits={settings.limits}
                  showToast={showToast}
                />
                <AiMemoryPanel scope="personal" limits={settings.limits} showToast={showToast} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </AccountCenter>
  );
}

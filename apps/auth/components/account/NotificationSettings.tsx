"use client";

import {
  notificationsApi,
  type NotificationChannel,
  type NotificationPreference,
} from "@/lib/services/notifications-api";
import { useI18n } from "@/lib/ui/i18n";
import { Button, Spinner, Surface } from "@hosanna/ui";
import {
  Bell,
  CalendarDays,
  CreditCard,
  Mail,
  Moon,
  Save,
  Smartphone,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ChannelKey = NotificationChannel;

type CategoryKey = "agenda" | "billing" | "org" | "product";

type CategoryPrefs = Record<CategoryKey, Record<ChannelKey, boolean>>;

const CATEGORIES: {
  key: CategoryKey;
  icon: typeof Bell;
}[] = [
  { key: "agenda", icon: CalendarDays },
  { key: "billing", icon: CreditCard },
  { key: "org", icon: Users },
  { key: "product", icon: Bell },
];

const CHANNELS: {
  key: ChannelKey;
  icon: typeof Bell;
}[] = [
  { key: "inbox", icon: Bell },
  { key: "push", icon: Smartphone },
  { key: "email", icon: Mail },
];

const DEFAULT_GLOBAL: Record<ChannelKey, boolean> = {
  inbox: true,
  push: true,
  email: false,
};

const DEFAULT_CATEGORY: Record<ChannelKey, boolean> = {
  inbox: true,
  push: true,
  email: false,
};

function emptyCategories(): CategoryPrefs {
  return {
    agenda: { ...DEFAULT_CATEGORY },
    billing: { ...DEFAULT_CATEGORY, email: true },
    org: { ...DEFAULT_CATEGORY, email: true },
    product: { ...DEFAULT_CATEGORY },
  };
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-m3-primary" : "bg-m3-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function NotificationSettingsSection({
  onToast,
}: {
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [global, setGlobal] = useState(DEFAULT_GLOBAL);
  const [categories, setCategories] = useState<CategoryPrefs>(emptyCategories);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [dirty, setDirty] = useState(false);

  const applyPreferences = useCallback((preferences: NotificationPreference[]) => {
    const nextGlobal = { ...DEFAULT_GLOBAL };
    const nextCategories = emptyCategories();
    let nextQuietStart = "";
    let nextQuietEnd = "";
    let nextTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    for (const pref of preferences) {
      if (!pref.type && !pref.category) {
        nextGlobal.inbox = pref.inbox;
        nextGlobal.push = pref.push;
        nextGlobal.email = pref.email;
        nextQuietStart = pref.quietHoursStart ?? "";
        nextQuietEnd = pref.quietHoursEnd ?? "";
        if (pref.timezone) nextTimezone = pref.timezone;
        continue;
      }
      if (!pref.type && pref.category && pref.category in nextCategories) {
        const key = pref.category as CategoryKey;
        nextCategories[key] = {
          inbox: pref.inbox,
          push: pref.push,
          email: pref.email,
        };
      }
    }

    setGlobal(nextGlobal);
    setCategories(nextCategories);
    setQuietStart(nextQuietStart);
    setQuietEnd(nextQuietEnd);
    setTimezone(nextTimezone);
    setDirty(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void notificationsApi
      .getPreferences()
      .then((data) => {
        if (cancelled) return;
        applyPreferences(data.preferences);
      })
      .catch(() => {
        if (!cancelled) {
          onToast(t("account.notifications.loadError"), "error");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyPreferences, onToast, t]);

  const markDirty = () => setDirty(true);

  const channelSummary = useMemo(() => {
    const enabled = CHANNELS.filter((c) => global[c.key]).map((c) =>
      t(`account.notifications.channels.${c.key}` as "account.notifications.channels.inbox"),
    );
    if (enabled.length === 0) return t("account.notifications.channelsNone");
    return enabled.join(" · ");
  }, [global, t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await notificationsApi.updatePreference({
        type: null,
        category: null,
        ...global,
        quietHoursStart: quietStart || null,
        quietHoursEnd: quietEnd || null,
        timezone: timezone || null,
      });

      await Promise.all(
        CATEGORIES.map((cat) =>
          notificationsApi.updatePreference({
            type: null,
            category: cat.key,
            ...categories[cat.key],
          }),
        ),
      );

      setDirty(false);
      onToast(t("account.notifications.saved"), "success");
    } catch (err) {
      onToast(
        t("account.notifications.saveError", {
          error: err instanceof Error ? err.message : "Error",
        }),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Surface className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-m3-text">
              {t("account.notifications.title")}
            </h3>
            <p className="text-xs text-m3-secondary mt-0.5 leading-relaxed">
              {t("account.notifications.description")}
            </p>
            {!isLoading ? (
              <p className="text-[11px] font-medium text-m3-primary/80 mt-2 truncate">
                {channelSummary}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isLoading || isSaving || !dirty}
          onClick={() => void handleSave()}
          icon={isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
          className="self-start"
        >
          {isSaving ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="sm" label={t("account.notifications.loading")} />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-m3-secondary mb-3">
              {t("account.notifications.defaultsTitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CHANNELS.map(({ key, icon: Icon }) => {
                const on = global[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      on
                        ? "border-m3-primary/30 bg-m3-primary/5"
                        : "border-m3-border bg-m3-sidebar/40"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        on ? "bg-m3-primary text-white" : "bg-m3-card text-m3-secondary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-m3-text">
                        {t(
                          `account.notifications.channels.${key}` as "account.notifications.channels.inbox",
                        )}
                      </p>
                      <p className="text-[11px] text-m3-secondary leading-snug">
                        {t(
                          `account.notifications.channels.${key}Desc` as "account.notifications.channels.inboxDesc",
                        )}
                      </p>
                    </div>
                    <Toggle
                      checked={on}
                      label={t(
                        `account.notifications.channels.${key}` as "account.notifications.channels.inbox",
                      )}
                      onChange={(next) => {
                        setGlobal((prev) => ({ ...prev, [key]: next }));
                        markDirty();
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-m3-secondary mt-2">
              {t("account.notifications.securityNote")}
            </p>
          </div>

          <div className="border-t border-m3-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-m3-secondary mb-3">
              {t("account.notifications.categoriesTitle")}
            </p>
            <div className="space-y-2">
              {CATEGORIES.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-xl border border-m3-border bg-m3-sidebar/30 p-3 sm:p-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-m3-card border border-m3-border text-m3-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-m3-text">
                        {t(
                          `account.notifications.categories.${key}` as "account.notifications.categories.agenda",
                        )}
                      </p>
                      <p className="text-[11px] text-m3-secondary">
                        {t(
                          `account.notifications.categories.${key}Desc` as "account.notifications.categories.agendaDesc",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map((ch) => (
                      <label
                        key={ch.key}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-m3-card border border-m3-border cursor-pointer"
                      >
                        <span className="text-xs font-medium text-m3-text">
                          {t(
                            `account.notifications.channels.${ch.key}` as "account.notifications.channels.inbox",
                          )}
                        </span>
                        <Toggle
                          checked={categories[key][ch.key]}
                          label={`${t(
                            `account.notifications.categories.${key}` as "account.notifications.categories.agenda",
                          )} ${t(
                            `account.notifications.channels.${ch.key}` as "account.notifications.channels.inbox",
                          )}`}
                          onChange={(next) => {
                            setCategories((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], [ch.key]: next },
                            }));
                            markDirty();
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-m3-border pt-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg bg-m3-card border border-m3-border text-m3-secondary flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-m3-text">
                  {t("account.notifications.quietHoursTitle")}
                </p>
                <p className="text-[11px] text-m3-secondary">
                  {t("account.notifications.quietHoursDesc")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-m3-text">
                  {t("account.notifications.quietStart")}
                </span>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => {
                    setQuietStart(e.target.value);
                    markDirty();
                  }}
                  className="min-h-10 px-3 rounded-md border border-m3-border bg-m3-card text-sm text-m3-text focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-m3-text">
                  {t("account.notifications.quietEnd")}
                </span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => {
                    setQuietEnd(e.target.value);
                    markDirty();
                  }}
                  className="min-h-10 px-3 rounded-md border border-m3-border bg-m3-card text-sm text-m3-text focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-m3-text">
                  {t("account.notifications.timezone")}
                </span>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    markDirty();
                  }}
                  placeholder="Europe/Lisbon"
                  className="min-h-10 px-3 rounded-md border border-m3-border bg-m3-card text-sm text-m3-text focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </Surface>
  );
}

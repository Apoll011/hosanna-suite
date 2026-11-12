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
  ChevronDown,
  CreditCard,
  Mail,
  Moon,
  Save,
  Smartphone,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type ChannelKey = NotificationChannel;
type CategoryKey = "agenda" | "billing" | "org" | "product";
type SectionId = "channels" | "categories" | "quiet";
type CategoryPrefs = Record<CategoryKey, Record<ChannelKey, boolean>>;

const CATEGORIES: { key: CategoryKey; icon: typeof Bell }[] = [
  { key: "agenda", icon: CalendarDays },
  { key: "billing", icon: CreditCard },
  { key: "org", icon: Users },
  { key: "product", icon: Bell },
];

const CHANNELS: { key: ChannelKey; icon: typeof Bell }[] = [
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-m3-primary" : "bg-m3-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ExpandableSection({
  id,
  title,
  summary,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  summary?: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-m3-border last:border-b-0">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3.5 text-left cursor-pointer hover:bg-m3-hover/40 px-1 -mx-1 rounded-md transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-m3-sidebar border border-m3-border text-m3-secondary flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-m3-text">{title}</span>
          {summary ? (
            <span className="block text-[11px] text-m3-secondary mt-0.5 truncate">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-m3-secondary shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} className="pb-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function channelLabel(
  t: ReturnType<typeof useI18n>["t"],
  key: ChannelKey,
): string {
  return t(`account.notifications.channels.${key}` as "account.notifications.channels.inbox");
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
  const [openSection, setOpenSection] = useState<SectionId>("channels");
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>("agenda");

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
    const enabled = CHANNELS.filter((c) => global[c.key]).map((c) => channelLabel(t, c.key));
    if (enabled.length === 0) return t("account.notifications.channelsNone");
    return enabled.join(" · ");
  }, [global, t]);

  const quietSummary = useMemo(() => {
    if (!quietStart || !quietEnd) return t("account.notifications.quietHoursDesc");
    return `${quietStart} – ${quietEnd} · ${timezone}`;
  }, [quietEnd, quietStart, t, timezone]);

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

  const toggleSection = (id: SectionId) =>
    setOpenSection((prev) => (prev === id ? prev : id));

  return (
    <Surface className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-m3-text">{t("account.notifications.title")}</h3>
          <p className="text-xs text-m3-secondary mt-0.5 leading-relaxed">
            {t("account.notifications.description")}
          </p>
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
        <div>
          <ExpandableSection
            id="notif-channels"
            title={t("account.notifications.defaultsTitle")}
            summary={channelSummary}
            icon={<Bell className="w-4 h-4" />}
            open={openSection === "channels"}
            onToggle={() => toggleSection("channels")}
          >
            <div className="space-y-1.5 pl-1">
              {CHANNELS.map(({ key, icon: Icon }) => {
                const on = global[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-m3-sidebar/60"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${on ? "text-m3-primary" : "text-m3-secondary"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-m3-text">{channelLabel(t, key)}</p>
                      <p className="text-[11px] text-m3-secondary">
                        {t(
                          `account.notifications.channels.${key}Desc` as "account.notifications.channels.inboxDesc",
                        )}
                      </p>
                    </div>
                    <Toggle
                      checked={on}
                      label={channelLabel(t, key)}
                      onChange={(next) => {
                        setGlobal((prev) => ({ ...prev, [key]: next }));
                        markDirty();
                      }}
                    />
                  </div>
                );
              })}
              <p className="text-[11px] text-m3-secondary px-2.5 pt-1">
                {t("account.notifications.securityNote")}
              </p>
            </div>
          </ExpandableSection>

          <ExpandableSection
            id="notif-categories"
            title={t("account.notifications.categoriesTitle")}
            summary={CATEGORIES.map((c) =>
              t(
                `account.notifications.categories.${c.key}` as "account.notifications.categories.agenda",
              ),
            ).join(" · ")}
            icon={<Users className="w-4 h-4" />}
            open={openSection === "categories"}
            onToggle={() => toggleSection("categories")}
          >
            <div className="rounded-lg border border-m3-border overflow-hidden">
              {CATEGORIES.map(({ key, icon: Icon }) => {
                const open = openCategory === key;
                const enabled = CHANNELS.filter((ch) => categories[key][ch.key])
                  .map((ch) => channelLabel(t, ch.key))
                  .join(" · ");
                return (
                  <div key={key} className="border-b border-m3-border last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenCategory((prev) => (prev === key ? null : key))}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer hover:bg-m3-hover/50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-m3-secondary shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-m3-text">
                          {t(
                            `account.notifications.categories.${key}` as "account.notifications.categories.agenda",
                          )}
                        </span>
                        <span className="block text-[11px] text-m3-secondary truncate">
                          {enabled || t("account.notifications.channelsNone")}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-m3-secondary transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open ? (
                      <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                        {CHANNELS.map((ch) => (
                          <label
                            key={ch.key}
                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-m3-sidebar/50 border border-m3-border cursor-pointer"
                          >
                            <span className="text-xs font-medium text-m3-text">
                              {channelLabel(t, ch.key)}
                            </span>
                            <Toggle
                              checked={categories[key][ch.key]}
                              label={`${t(
                                `account.notifications.categories.${key}` as "account.notifications.categories.agenda",
                              )} ${channelLabel(t, ch.key)}`}
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
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ExpandableSection>

          <ExpandableSection
            id="notif-quiet"
            title={t("account.notifications.quietHoursTitle")}
            summary={quietSummary}
            icon={<Moon className="w-4 h-4" />}
            open={openSection === "quiet"}
            onToggle={() => toggleSection("quiet")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-1">
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
          </ExpandableSection>
        </div>
      )}
    </Surface>
  );
}

"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_GENERAL,
  readOrgGeneral,
  selectClass,
  type OrgGeneralSettings,
} from "@/lib/org-ui";
import { Button, PageHeader, Spinner, Surface } from "@hosanna/ui";
import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function OrgRegionalPage() {
  const { t } = useI18n();
  const { organization, metadata, capabilities, isLoading, refresh } = useActiveOrganization();

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [general, setGeneral] = useState<OrgGeneralSettings>(DEFAULT_GENERAL);
  const [saved, setSaved] = useState<OrgGeneralSettings>(DEFAULT_GENERAL);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!organization) return;
    const next = readOrgGeneral(metadata);
    setGeneral(next);
    setSaved(next);
  }, [organization, metadata]);

  const update = <K extends keyof OrgGeneralSettings>(key: K, value: OrgGeneralSettings[K]) => {
    setGeneral((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capabilities.canManageOrg || !organization) return;
    setIsSaving(true);
    try {
      const currentSettings = (metadata.settings as Record<string, unknown> | undefined) || {};
      await authClient.organization.update({
        data: {
          metadata: {
            ...metadata,
            settings: {
              ...currentSettings,
              general: {
                ...((currentSettings.general as Record<string, unknown> | undefined) || {}),
                locale: general.locale,
                timezone: general.timezone,
                weekStartsOn: general.weekStartsOn,
              },
            },
          },
        },
      });
      setSaved(general);
      await refresh();
      showToast(t("settings.toast.orgSaved"), "success");
    } catch (err) {
      showToast(
        t("settings.toast.orgSaveError", {
          error: (err as Error)?.message || t("settings.general.commError"),
        }),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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

  const canEdit = capabilities.canManageOrg;
  const isDirty = JSON.stringify(general) !== JSON.stringify(saved);

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-6">
        <PageHeader
          title={t("settings.general.title")}
          description={t("settings.general.desc")}
        />

        <form onSubmit={(e) => void handleSave(e)}>
          <Surface className="space-y-6">
            {!canEdit ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {t("settings.general.readOnly")}
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label className="text-label">{t("settings.general.orgLanguage")}</label>
              <select
                disabled={!canEdit || isSaving}
                value={general.locale}
                onChange={(e) => update("locale", e.target.value)}
                className={selectClass}
              >
                <option value="pt-PT">{t("settings.general.locales.ptPT")}</option>
                <option value="pt-BR">{t("settings.general.locales.ptBR")}</option>
                <option value="en-US">{t("settings.general.locales.enUS")}</option>
                <option value="es-ES">{t("settings.general.locales.esES")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label">{t("settings.general.timezone")}</label>
              <select
                disabled={!canEdit || isSaving}
                value={general.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className={selectClass}
              >
                <optgroup label={t("settings.general.timezones.portugalGroup")}>
                  <option value="Europe/Lisbon">{t("settings.general.timezones.lisbon")}</option>
                  <option value="Atlantic/Azores">{t("settings.general.timezones.azores")}</option>
                </optgroup>
                <optgroup label={t("settings.general.timezones.brazilGroup")}>
                  <option value="America/Sao_Paulo">
                    {t("settings.general.timezones.saoPaulo")}
                  </option>
                  <option value="America/Manaus">{t("settings.general.timezones.manaus")}</option>
                </optgroup>
                <optgroup label={t("settings.general.timezones.otherRegionsGroup")}>
                  <option value="Europe/London">{t("settings.general.timezones.london")}</option>
                  <option value="America/New_York">
                    {t("settings.general.timezones.newYork")}
                  </option>
                  <option value="UTC">{t("settings.general.timezones.utc")}</option>
                </optgroup>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label">{t("settings.general.weekStartsOn")}</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: 1,
                    label: t("settings.general.monday"),
                    desc: t("settings.general.mondayDesc"),
                  },
                  {
                    value: 0,
                    label: t("settings.general.sunday"),
                    desc: t("settings.general.sundayDesc"),
                  },
                ].map((day) => {
                  const checked = general.weekStartsOn === day.value;
                  return (
                    <label
                      key={day.value}
                      className={`flex flex-col p-3 rounded-md border transition-colors cursor-pointer ${
                        checked
                          ? "border-m3-primary bg-m3-primary/5 text-m3-primary ring-1 ring-m3-primary/30"
                          : "border-m3-border hover:bg-m3-sidebar text-m3-text"
                      } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{day.label}</span>
                        <input
                          type="radio"
                          name="weekStartsOn"
                          disabled={!canEdit || isSaving}
                          checked={checked}
                          onChange={() => update("weekStartsOn", day.value)}
                          className="w-4 h-4 text-m3-primary"
                        />
                      </div>
                      <span className="text-caption mt-0.5">{day.desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {canEdit ? (
              <div className="flex justify-end pt-2 border-t border-m3-border/60">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving || !isDirty}
                  isLoading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {isSaving ? t("settings.general.saving") : t("settings.general.save")}
                </Button>
              </div>
            ) : null}
          </Surface>
        </form>
      </div>
    </AccountCenter>
  );
}

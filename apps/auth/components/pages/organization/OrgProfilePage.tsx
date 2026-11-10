"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { compressImage } from "@/lib/compress-image";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_ACCENT_COLOR,
  PRESET_COLORS,
  orgInitials,
  readOrgAppearance,
  type OrgAppearance,
} from "@/lib/org-ui";
import { Button, Input, PageHeader, Spinner, Surface } from "@hosanna/ui";
import { Camera, Check, ImagePlus, PenLine, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function OrgProfilePage() {
  const { t } = useI18n();
  const { organization, metadata, capabilities, isLoading, refresh } = useActiveOrganization();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [appearance, setAppearance] = useState<OrgAppearance>({
    accentColor: DEFAULT_ACCENT_COLOR,
    showBranding: true,
  });

  const [draftName, setDraftName] = useState("");
  const [draftLogo, setDraftLogo] = useState<string | null>(null);
  const [draftShortName, setDraftShortName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftAppearance, setDraftAppearance] = useState<OrgAppearance>(appearance);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!organization) return;
    const appearanceNext = readOrgAppearance(metadata);
    const short = typeof metadata.shortName === "string" ? metadata.shortName : "";
    const desc = typeof metadata.description === "string" ? metadata.description : "";
    setName(organization.name || "");
    setLogo(organization.logo || null);
    setShortName(short);
    setDescription(desc);
    setAppearance(appearanceNext);
    if (!isEditing) {
      setDraftName(organization.name || "");
      setDraftLogo(organization.logo || null);
      setDraftShortName(short);
      setDraftDescription(desc);
      setDraftAppearance(appearanceNext);
    }
  }, [organization, metadata, isEditing]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("settings.account.profile.invalidImage"), "error");
      return;
    }
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 0.85);
      setDraftLogo(compressed);
    } catch {
      showToast(t("settings.workspace.imageProcessError"), "error");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draftName.trim()) {
      showToast(t("settings.workspace.nameRequired"), "error");
      return;
    }
    setIsSaving(true);
    try {
      const updatedMetadata = {
        ...metadata,
        description: draftDescription.trim() || undefined,
        shortName: draftShortName.trim() || undefined,
        settings: {
          ...((metadata.settings as Record<string, unknown> | undefined) || {}),
          appearance: {
            accentColor: draftAppearance.accentColor || DEFAULT_ACCENT_COLOR,
            showBranding: draftAppearance.showBranding,
          },
        },
      };
      await authClient.organization.update({
        data: {
          name: draftName.trim(),
          logo: draftLogo || undefined,
          metadata: updatedMetadata,
        },
      });
      setIsEditing(false);
      await refresh();
      showToast(t("settings.workspace.saved"), "success");
    } catch (err) {
      showToast(
        t("settings.workspace.saveError", {
          error: (err as Error)?.message || "Error",
        }),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftName(name);
    setDraftLogo(logo);
    setDraftShortName(shortName);
    setDraftDescription(description);
    setDraftAppearance(appearance);
    setIsEditing(false);
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

  const displayLogo = isEditing ? draftLogo : logo;
  const displayAccent = isEditing ? draftAppearance.accentColor : appearance.accentColor;
  const displayBranding = isEditing ? draftAppearance.showBranding : appearance.showBranding;
  const canEdit = capabilities.canManageOrg;

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-6">
        <PageHeader
          title={t("settings.workspace.title")}
          description={t("settings.workspace.desc")}
        />

        {!canEdit ? (
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {t("settings.general.readOnly")}
          </p>
        ) : null}

        <form onSubmit={(e) => void handleSave(e)}>
          <Surface className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                <div className="relative group w-28 h-28 rounded-xl bg-m3-sidebar flex items-center justify-center border border-dashed border-m3-border overflow-hidden">
                  {displayLogo ? (
                    <img src={displayLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-m3-secondary text-center px-2">
                      <ImagePlus className="w-8 h-8 mb-1 opacity-70" />
                      <span className="text-[11px]">{t("settings.workspace.noLogo")}</span>
                    </div>
                  )}
                  {isEditing && canEdit ? (
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                      {isCompressing ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-white mb-1" />
                          <span className="text-[11px] text-white">
                            {displayLogo
                              ? t("settings.workspace.change")
                              : t("settings.workspace.add")}
                          </span>
                        </>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleLogoChange(e)}
                        className="hidden"
                        disabled={isCompressing || isSaving}
                      />
                    </label>
                  ) : null}
                </div>
                {isEditing && canEdit && displayLogo ? (
                  <button
                    type="button"
                    onClick={() => setDraftLogo(null)}
                    className="text-xs text-m3-danger font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("settings.workspace.removeLogo")}
                  </button>
                ) : null}
                {!displayLogo && !isEditing ? (
                  <span className="text-sm font-semibold text-m3-primary">{orgInitials(name)}</span>
                ) : null}
              </div>

              <div className="flex-1 w-full space-y-4 min-w-0">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label={t("settings.workspace.orgNameLabel")}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        required
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Input
                        label={t("settings.workspace.shortNameLabel")}
                        value={draftShortName}
                        onChange={(e) => setDraftShortName(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-label text-m3-text mb-1.5">
                        {t("settings.workspace.descriptionLabel")}
                      </label>
                      <textarea
                        rows={3}
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-xl border border-m3-border bg-m3-card px-3.5 py-2.5 text-sm text-m3-text placeholder:text-m3-secondary focus:outline-hidden focus:ring-2 focus:ring-m3-primary/30 focus:border-m3-primary resize-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-m3-text">
                        {name || t("settings.workspace.defaultOrgName")}
                      </h2>
                      {shortName ? (
                        <span className="text-xs font-semibold text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-md">
                          {shortName}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-m3-secondary max-w-xl">
                      {description || (
                        <span className="italic">{t("settings.workspace.noDescription")}</span>
                      )}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3 text-xs text-m3-secondary">
                      <span className="font-mono">ID · {organization.id}</span>
                      <span className="font-mono">@{organization.slug}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-m3-border/60" />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-m3-text">
                  {t("settings.workspace.visualIdentityTitle")}
                </h3>
                <p className="text-xs text-m3-secondary mt-0.5">
                  {t("settings.workspace.visualIdentityDesc")}
                </p>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-label text-m3-text block">
                      {t("settings.workspace.accentColorLabel")}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        disabled={isSaving}
                        value={draftAppearance.accentColor}
                        onChange={(e) =>
                          setDraftAppearance({
                            ...draftAppearance,
                            accentColor: e.target.value,
                          })
                        }
                        className="w-11 h-11 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <Input
                        disabled={isSaving}
                        value={draftAppearance.accentColor}
                        onChange={(e) =>
                          setDraftAppearance({
                            ...draftAppearance,
                            accentColor: e.target.value,
                          })
                        }
                        className="font-mono uppercase text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          disabled={isSaving}
                          title={preset.name}
                          onClick={() =>
                            setDraftAppearance({
                              ...draftAppearance,
                              accentColor: preset.hex,
                            })
                          }
                          className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center ${
                            draftAppearance.accentColor.toLowerCase() === preset.hex.toLowerCase()
                              ? "ring-2 ring-offset-2 ring-m3-text dark:ring-white dark:ring-offset-m3-card"
                              : ""
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        >
                          {draftAppearance.accentColor.toLowerCase() ===
                          preset.hex.toLowerCase() ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3.5 border border-m3-border rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isSaving}
                      checked={draftAppearance.showBranding}
                      onChange={(e) =>
                        setDraftAppearance({
                          ...draftAppearance,
                          showBranding: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-0.5 rounded text-m3-primary border-m3-border"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-m3-text">
                        {t("settings.workspace.showBrandingLabel")}
                      </span>
                      <p className="text-m3-secondary mt-0.5">
                        {t("settings.workspace.showBrandingDesc")}
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-m3-border/60 bg-m3-sidebar/40">
                    <div
                      className="w-9 h-9 rounded-lg shrink-0"
                      style={{ backgroundColor: displayAccent }}
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-m3-secondary font-semibold">
                        {t("settings.workspace.accentColorTitle")}
                      </span>
                      <p className="font-mono text-sm font-semibold text-m3-text">
                        {displayAccent.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-m3-border/60 bg-m3-sidebar/40">
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-m3-secondary font-semibold">
                        {t("settings.workspace.brandingTitle")}
                      </span>
                      <p className="text-sm font-semibold text-m3-text">
                        {displayBranding
                          ? t("settings.workspace.brandingActive")
                          : t("settings.workspace.brandingHidden")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {canEdit ? (
              <div className="flex justify-end gap-2 pt-2 border-t border-m3-border/60">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSaving}
                      isLoading={isSaving}
                      icon={<Save className="w-4 h-4" />}
                    >
                      {isSaving
                        ? t("settings.workspace.saving")
                        : t("settings.workspace.saveChanges")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    icon={<PenLine className="w-4 h-4" />}
                  >
                    {t("settings.workspace.editProfile")}
                  </Button>
                )}
              </div>
            ) : null}
          </Surface>
        </form>
      </div>
    </AccountCenter>
  );
}

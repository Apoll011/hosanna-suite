/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner, Surface, useCan } from "@hosanna/ui";
import { PRINT_BRAND_ACCENT } from "@/src/components/print/brand";
import { toOrgPrintSettings } from "@/src/components/print/options";
import { PrintOptionsPanel } from "@/src/components/print/PrintOptionsPanel";
import { getTemplateFamilyInfo } from "@/src/components/print/templateFamilies";
import { TemplatePicker } from "@/src/components/print/TemplatePicker";
import type {
  OrgPrintSettings,
  PrintBrand,
  PrintOptions,
  PrintTemplateFamily,
} from "@/src/components/print/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePrint } from "@/src/contexts/PrintContext";
import { useOrgSettings } from "@/src/hooks/useOrgSettings";
import { useI18n } from "@/src/lib/i18n";

import {
  Eye,
  LayoutTemplate,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import React, { useMemo } from "react";

export interface PrintingTabProps {
  active: boolean;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

const PRINT_CONTEXT = { hasSongs: true, hasSongContainers: true, canPageBreak: true };

const SAMPLE_SONG = {
  id: "sample-song-demo",
  title: "Quão Grande és Tu",
  artist: "Carl Boberg",
  content: `{title: Quão Grande és Tu}\n{artist: Carl Boberg}\n{key: G}\n{tempo: 72}\n{time: 4/4}\n{capo: 0}\n{ccli: 4672}\n\n{c: Verso 1}\n[G]Senhor meu Deus, quando eu mara[C]vilhado\n[G]Fico a pensar nas [D]obras de Tuas [G]mãos\n[G]O céu azul de estrelas pon[C]tilhado\n[G]Mostrando a glória [D]do Teu grande a[G]mor\n\n{c: Coro}\n[D]Então minha alma [G]canta a Ti, Se[C]nhor\nQuão grande és [G]Tu! Quão grande és [D]Tu!\n[D]Então minha alma [G]canta a Ti, Se[C]nhor\nQuão grande és [G]Tu! [D]Quão grande és [G]Tu!`,
  path: "Hinos/Quão Grande és Tu.pro",
  tags: ["Hinos", "Louvor"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PrintingTab: React.FC<PrintingTabProps> = ({ active, showToast }) => {
  const { organization } = useAuth();
  const { t, locale } = useI18n();
  const { printSong } = usePrint();
  const { granted: canManageOrg, loading: canLoading } = useCan("organization.update");
  const { settings, isSaving, set, reset, save } = useOrgSettings();

  const brand = useMemo<PrintBrand>(() => {
    const meta = (organization?.metadata as Record<string, unknown>) || {};
    return {
      churchName: organization?.name || "",
      churchShortName: (meta.shortName as string) || undefined,
      churchLogo: organization?.logo || null,
      accentColor: PRINT_BRAND_ACCENT,
      locale,
    };
  }, [organization, locale]);

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-m3-secondary">
        <Spinner size="lg" label={t("settings.general.loading")} />
      </div>
    );
  }

  const printOptions: PrintOptions = { ...settings.print, includeSongs: true };

  const handlePrintChange = (patch: Partial<PrintOptions>) => {
    set({
      ...settings,
      print: toOrgPrintSettings({ ...settings.print, includeSongs: true, ...patch }),
    });
  };

  const selectTemplate = (family: PrintTemplateFamily) => {
    handlePrintChange({
      ...getTemplateFamilyInfo(family).presets,
      templateFamily: family,
    });
  };

  const handleTestPrint = () => {
    printSong(SAMPLE_SONG, settings.print as OrgPrintSettings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg) return;
    try {
      await save();
      showToast?.(t("settings.toast.orgSaved"), "success");
    } catch (err) {
      showToast?.(
        t("settings.toast.orgSaveError", {
          error: (err as { message?: string })?.message || t("settings.general.commError"),
        }),
        "error",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)] gap-6 items-start">
        {/* Templates — occupies the “preview” side of the print modal */}
        <Surface className="h-full">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-title text-m3-text flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-m3-primary" />
                {t("print.options.groups.template")}
              </h2>
              <p className="mt-1 text-muted">
                {t(`print.templates.${printOptions.templateFamily}.description`)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!canManageOrg && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  {t("settings.general.readOnly")}
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Eye className="w-4 h-4" />}
                onClick={handleTestPrint}
              >
                {t("print.settingsCard.testModel")}
              </Button>
            </div>
          </div>

          <TemplatePicker
            value={printOptions.templateFamily}
            onSelect={selectTemplate}
            brand={brand}
            showChords={printOptions.showChords}
            disabled={!canManageOrg || isSaving}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          />
        </Surface>

        {/* Settings — like the print modal options column */}
        <Surface className="h-full">
          <div className="mb-6">
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-m3-primary" />
              {t("settings.tabs.printing")}
            </h2>
            <p className="mt-1 text-muted">{t("settings.printing.pageDesc")}</p>
          </div>

          <PrintOptionsPanel
            options={printOptions}
            onChange={handlePrintChange}
            brand={brand}
            context={PRINT_CONTEXT}
            disabled={!canManageOrg || isSaving}
            layout="sidebar"
            hideTemplate
          />
        </Surface>
      </div>

      {canManageOrg && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            disabled={isSaving}
            className="text-xs text-m3-secondary hover:text-m3-text flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("settings.general.reset")}
          </button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            icon={
              isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />
            }
          >
            {isSaving ? t("settings.general.saving") : t("settings.general.save")}
          </Button>
        </div>
      )}
    </form>
  );
};

"use client";

import { useI18n } from "@/lib/ui/i18n";
import { LANGUAGES, type PersonalLanguage } from "@hosanna/i18n";
import { Surface } from "@hosanna/ui";
import { Check, Globe } from "lucide-react";

export function LanguagePreferencesSection({
  onToast,
}: {
  onToast?: (msg: string, type: "success" | "error") => void;
}) {
  const { t, personalLanguage, setPersonalLanguage } = useI18n();

  const optionCard = (selected: boolean) =>
    `group relative rounded-[var(--radius-lg)] border p-4 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-m3-primary/50 ${
      selected
        ? "border-m3-primary bg-m3-primary/5 ring-2 ring-m3-primary/20 shadow-sm"
        : "border-m3-border hover:border-m3-primary/40 bg-m3-sidebar/40"
    }`;

  const select = (lang: PersonalLanguage) => {
    setPersonalLanguage(lang);
    const label =
      lang === "auto"
        ? t("account.language.auto")
        : (LANGUAGES.find((l) => l.code === lang)?.nativeLabel ?? lang);
    onToast?.(t("account.language.changed", { language: label }), "success");
  };

  return (
    <Surface>
      <div className="mb-6">
        <h3 className="text-title text-m3-text flex items-center gap-2">
          <Globe className="w-5 h-5 text-m3-primary" />
          {t("account.language.title")}
        </h3>
        <p className="mt-1 text-muted">{t("account.language.desc")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => select("auto")}
          aria-pressed={personalLanguage === "auto"}
          className={optionCard(personalLanguage === "auto")}
        >
          {personalLanguage === "auto" ? (
            <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
            </div>
          ) : null}
          <div className="flex items-center gap-3 pr-6">
            <Globe className="h-6 w-6 shrink-0 text-m3-secondary" aria-hidden />
            <div className="min-w-0 text-left">
              <span className="block font-semibold text-sm text-m3-text">
                {t("account.language.auto")}
              </span>
              <span className="block mt-0.5 text-caption">{t("account.language.autoDesc")}</span>
            </div>
          </div>
        </button>

        {LANGUAGES.map((lang) => {
          const selected = personalLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => select(lang.code)}
              aria-pressed={selected}
              className={optionCard(selected)}
            >
              {selected ? (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                </div>
              ) : null}
              <div className="flex items-center gap-3 pr-6">
                <span className="text-2xl shrink-0" aria-hidden>
                  {lang.flag}
                </span>
                <div className="min-w-0 text-left">
                  <span className="block font-semibold text-sm text-m3-text">{lang.nativeLabel}</span>
                  <span className="block mt-0.5 text-caption">{lang.englishLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Surface>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LANGUAGES, type Language } from "@hosanna/i18n";

import { useI18n } from "@/src/lib/i18n";

export function MenuLanguageSelector({ className = "" }: { className?: string }) {
  const { language, setPersonalLanguage } = useI18n();

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-m3-border/55 bg-m3-sidebar/55 p-0.5 ${className}`}
      role="group"
      aria-label="Change language"
    >
      {LANGUAGES.map((lang) => {
        const selected = lang.code === language;
        return (
          <button
            key={lang.code}
            type="button"
            aria-pressed={selected}
            title={lang.nativeLabel}
            onClick={() => setPersonalLanguage(lang.code as Language)}
            className={`min-w-7 cursor-pointer rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              selected
                ? "bg-m3-card text-m3-primary shadow-xs"
                : "text-m3-secondary hover:text-m3-text"
            }`}
          >
            {lang.code}
          </button>
        );
      })}
    </div>
  );
}

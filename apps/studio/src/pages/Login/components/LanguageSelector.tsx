/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { LANGUAGES, LanguageMeta } from "@/src/lib/i18n/languages";
import { Language } from "@/src/lib/i18n/types";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export { LANGUAGES as SUPPORTED_LANGUAGES };
export type { Language };

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setPersonalLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang: LanguageMeta =
    LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-m3-card/80 backdrop-blur-md border border-m3-border/80 text-m3-text shadow-[var(--shadow-sm)] transition-colors inline-flex items-center gap-1.5"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-bold uppercase hidden sm:inline pr-0.5">
          {currentLang.code}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-[var(--radius-xl)] border border-m3-border bg-m3-card p-1.5 shadow-[var(--shadow-lg)] z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setPersonalLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 min-h-10 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-m3-primary/10 text-m3-primary font-semibold"
                    : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

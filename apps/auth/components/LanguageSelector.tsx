"use client";

import { useI18n } from "@/lib/ui/i18n";
import { LANGUAGES, type Language, type LanguageMeta } from "@hosanna/i18n";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Variant = "default" | "menu";

export function LanguageSelector({
  className = "",
  variant = "default",
}: {
  className?: string;
  /** `menu` = compact code chips for AccountMenu (no nested dropdown). */
  variant?: Variant;
}) {
  const { language, setPersonalLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current: LanguageMeta = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (variant === "menu") return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  if (variant === "menu") {
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
              className={`min-w-7 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
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

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-m3-card/80 backdrop-blur-md border border-m3-border/80 text-m3-text shadow-sm transition-colors inline-flex items-center gap-1.5"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-bold uppercase hidden sm:inline pr-0.5">{current.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl border border-m3-border bg-m3-card p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setPersonalLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 min-h-10 text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-m3-primary/10 text-m3-primary font-semibold"
                    : "text-m3-text hover:bg-m3-hover"
                }`}
              >
                <span className="font-medium">{lang.nativeLabel}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                  {lang.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

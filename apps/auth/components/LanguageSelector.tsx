"use client";

import { useLocale, type AuthLocale } from "@/lib/locale";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const OPTIONS: Array<{ code: AuthLocale; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((l) => l.code === locale) ?? OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl border border-m3-border bg-m3-card p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
          {OPTIONS.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 min-h-10 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-m3-primary/10 text-m3-primary font-semibold"
                    : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

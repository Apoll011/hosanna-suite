"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Full-page chrome for the account center (not the login card). */
export function AccountShell({
  children,
  toast,
}: {
  children: ReactNode;
  toast?: { msg: string; type: "success" | "error" } | null;
}) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useI18n();

  return (
    <div className="min-h-dvh w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
      <header className="sticky top-0 z-30 border-b border-m3-border/70 bg-m3-card/85 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/account"
            className="flex items-center gap-2 select-none px-2.5 py-1.5 rounded-full bg-m3-sidebar/80 border border-m3-border/60"
          >
            <img src="/favicon.png" alt="" className="w-5 h-5 object-contain rounded-md" />
            <span className="font-semibold text-xs sm:text-sm tracking-tight">{t("brand.name")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-m3-sidebar/80 border border-m3-border/60 text-m3-secondary hover:bg-m3-hover active:scale-95 transition-all cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-m3-secondary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div
          className={`mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 ${
            toast.type === "error" ? "text-m3-danger" : "text-m3-success"
          }`}
          role="status"
        >
          <div
            className={`rounded-md border px-3 py-2.5 text-sm font-medium animate-in fade-in duration-200 ${
              toast.type === "error"
                ? "bg-m3-danger/10 border-m3-danger/30"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      <main className="flex-1 w-full mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="w-full border-t border-m3-border/60 mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-caption">
          <span>
            {t("brand.name")} &copy; {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://hosanna.live"
              className="hover:text-m3-text transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {t("footer.help")}
            </a>
            <a
              href="https://hosanna.live/privacy"
              className="hover:text-m3-text transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {t("footer.privacy")}
            </a>
            <a
              href="https://hosanna.live/terms"
              className="hover:text-m3-text transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {t("footer.terms")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

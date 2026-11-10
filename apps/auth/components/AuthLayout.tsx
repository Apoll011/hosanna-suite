"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { AlertCircle, CheckCircle2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  redirectMessage?: string;
  errorMsg?: string;
  optionalLink?: string;
  optionalMsg?: string;
}

export function AuthLayout({
  children,
  headerTitle,
  headerSubtitle,
  redirectMessage,
  errorMsg,
  optionalLink,
  optionalMsg,
}: AuthLayoutProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden font-sans text-m3-text antialiased selection:bg-m3-primary/20">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/background.webp"
          alt=""
          className="w-full h-full object-cover scale-105 opacity-35 dark:opacity-25 transition-all duration-700 blur-[3px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-m3-bg/70 via-m3-bg/85 to-m3-sidebar/95 dark:from-m3-bg/85 dark:via-m3-bg/92 dark:to-m3-bg/98 transition-colors duration-500" />
      </div>

      <header className="w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 select-none px-3 py-1.5 rounded-full bg-m3-card/70 backdrop-blur-md border border-m3-border/60 shadow-xs">
            <img
              src="/favicon.png"
              alt="Hosanna"
              className="w-5 h-5 object-contain rounded-md"
            />
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-m3-text">
              {t("brand.name")} Auth
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-m3-card/70 backdrop-blur-md border border-m3-border/60 text-m3-secondary hover:bg-m3-card dark:hover:bg-m3-hover active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-m3-secondary" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-3 md:p-4 z-10">
        <div className="w-full max-w-md sm:max-w-124 md:max-w-135 bg-m3-card/95 backdrop-blur-xl sm:border sm:border-m3-border/80 rounded-xl sm:rounded-[28px] shadow-lg shadow-black/5 dark:shadow-black/40 px-6 py-7 sm:p-8 md:p-9 transition-all">
          <div className="flex flex-col items-center text-center mb-8 select-none">
            <h1 className="text-title text-m3-text">{headerTitle || t("brand.name")}</h1>
            {headerSubtitle && <p className="mt-2 text-muted max-w-sm">{headerSubtitle}</p>}
          </div>

          {redirectMessage && (
            <div className="mb-5 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3 rounded-md bg-m3-danger/10 border border-m3-danger/30 text-m3-danger text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          )}

          <div className="w-full">{children}</div>

          {optionalLink && optionalMsg && (
            <div className="mt-8 pt-4 border-t border-m3-border/50 text-center">
              <Link
                href={optionalLink}
                className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline transition-colors"
              >
                {optionalMsg}
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-135 mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-m3-secondary shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span>Hosanna &copy; {new Date().getFullYear()}</span>
        </div>
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
      </footer>
    </div>
  );
}

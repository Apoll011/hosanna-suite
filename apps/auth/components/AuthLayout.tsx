"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/ui/i18n";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
  const { t } = useI18n();

  return (
    <div className="min-h-dvh w-full flex flex-col justify-between relative overflow-x-hidden font-sans text-m3-text antialiased selection:bg-m3-primary/20">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/background.webp"
          alt=""
          className="w-full h-full object-cover scale-105 opacity-35 dark:opacity-25 transition-opacity duration-700 blur-[2px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-m3-bg/75 via-m3-bg/88 to-m3-sidebar/95 dark:from-m3-bg/88 dark:via-m3-bg/94 dark:to-m3-bg/98" />
      </div>

      <header className="relative z-20 flex shrink-0 items-center justify-between px-4 pt-4 pb-2 sm:px-8">
        <div className="flex items-center gap-2 select-none rounded-full border border-m3-border/60 bg-m3-card/75 px-3 py-1.5 shadow-xs backdrop-blur-md">
          <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md object-contain" />
          <span className="text-xs font-semibold tracking-tight sm:text-sm">{t("brand.name")}</span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle className="bg-m3-card/75 backdrop-blur-md hover:bg-m3-card dark:hover:bg-m3-hover shadow-xs" />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 w-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-md rounded-2xl bg-m3-card/95 px-6 py-8 shadow-lg shadow-black/5 backdrop-blur-xl transition-all sm:max-w-lg sm:border sm:border-m3-border/80 sm:rounded-[28px] sm:px-8 sm:py-9 md:max-w-xl dark:shadow-black/40">
          <div className="mb-8 flex flex-col items-center text-center select-none">
            <h1 className="text-title text-m3-text">{headerTitle || t("brand.name")}</h1>
            {headerSubtitle ? (
              <p className="mt-2 max-w-sm text-muted text-pretty">{headerSubtitle}</p>
            ) : null}
          </div>

          {redirectMessage ? (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-800 animate-in fade-in duration-200 sm:text-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{redirectMessage}</span>
            </div>
          ) : null}

          {errorMsg ? (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-m3-danger/30 bg-m3-danger/10 px-3.5 py-3 text-xs font-medium text-m3-danger animate-in fade-in duration-200 sm:text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          ) : null}

          <div className="w-full">{children}</div>

          {optionalLink && optionalMsg ? (
            <div className="mt-8 border-t border-m3-border/50 pt-5 text-center">
              <Link
                href={optionalLink}
                className="text-xs font-medium text-m3-primary transition-colors hover:text-m3-primary-dark hover:underline sm:text-sm"
              >
                {optionalMsg}
              </Link>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-xl shrink-0 flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-m3-secondary">
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
      </footer>
    </div>
  );
}

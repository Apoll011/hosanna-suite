/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { AlertCircle, CheckCircle2, Moon, Sun } from "lucide-react";
import React from "react";
import bg from "../../assets/images/background.webp";
import { useTheme } from "../../contexts/ThemeContext";
import { LanguageSelector } from "./components/LanguageSelector";

interface LoginLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  redirectMessage?: string;
  errorMsg?: string;
  optionalLink?: string;
  optionalMsg?: string;
  titleMb?: number;
  compactBranding?: boolean;
}

export default function LoginLayout({
  children,
  headerTitle,
  headerSubtitle,
  redirectMessage,
  errorMsg,
  optionalLink,
  optionalMsg,
}: LoginLayoutProps) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden font-sans text-m3-text antialiased selection:bg-m3-primary/20">
      {/* Dynamic Ambient Background Image with soft overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={bg}
          alt="Background"
          className="w-full h-full object-cover scale-105 opacity-35 dark:opacity-25 transition-all duration-700 blur-[3px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-m3-bg/70 via-m3-bg/85 to-m3-sidebar/95 dark:from-m3-bg/85 dark:via-m3-bg/92 dark:to-m3-bg/98 transition-colors duration-500" />
      </div>

      {/* Top action header: Language selector & Theme Toggle */}
      <header className="w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 select-none px-3 py-1.5 rounded-full bg-m3-card/70 backdrop-blur-md border border-m3-border/60 shadow-xs">
            <img
              src="/favicon.png"
              alt="Hosanna Studio"
              className="w-5 h-5 object-contain rounded-md"
            />
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-m3-text">
              Hosanna Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
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

      {/* Main Center Stage */}
      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-3 md:p-4 z-10">
        <div className="w-full max-w-md sm:max-w-124 md:max-w-135 bg-m3-card/95 backdrop-blur-xl sm:border sm:border-m3-border/80 rounded-[var(--radius-xl)] sm:rounded-[28px] shadow-lg shadow-black/5 dark:shadow-black/40 px-6 py-4 sm:p-6 md:p-8 transition-all">
          <div className="flex flex-col items-center text-center mb-7 sm:mb-8 select-none">
            <h1 className="text-title text-m3-text">
              {headerTitle || "Hosanna Studio"}
            </h1>

            {headerSubtitle && (
              <p className="mt-1.5 text-muted max-w-sm">{headerSubtitle}</p>
            )}
          </div>

          {redirectMessage && (
            <div className="mb-5 p-3 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3 rounded-[var(--radius-md)] bg-m3-danger/10 border border-m3-danger/30 text-m3-danger text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          )}

          <div className="w-full">{children}</div>

          {optionalLink && optionalMsg && (
            <div className="mt-8 pt-4 border-t border-m3-border/50 text-center">
              <AppLink
                to={optionalLink}
                className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline transition-colors"
              >
                <span>{optionalMsg}</span>
              </AppLink>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-135 mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-m3-secondary shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span>Hosanna Studio &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hover:text-m3-text transition-colors"
          >
            Ajuda
          </a>
          <a
            href="https://hosanna.live/privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-m3-text transition-colors"
          >
            Privacidade
          </a>
          <a
            href="https://hosanna.live/terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-m3-text transition-colors"
          >
            Termos
          </a>
        </div>
      </footer>
    </div>
  );
}

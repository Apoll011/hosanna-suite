"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountToastBanner } from "@/components/account/AccountToast";
import { NavigationProgress } from "@/components/account/NavigationProgress";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/i18n";
import { LoadingBar } from "@hosanna/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

/** Full-page chrome for the account center (not the login card). */
export function AccountShell({
  children,
  toast,
  returnUrl,
  headerActions,
}: {
  children: ReactNode;
  toast?: { msg: string; type: "success" | "error" } | null;
  /** When set, the brand pill shows a back arrow on hover and navigates here. */
  returnUrl?: string | null;
  headerActions?: ReactNode;
}) {
  const { t } = useI18n();
  const { isRefreshing } = useActiveOrganization();
  const canGoBack = Boolean(returnUrl);

  const brandPillClass =
    "group relative flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-sidebar/80 px-2.5 py-1.5 transition-colors hover:bg-m3-hover";

  const brandContent = (
    <>
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {canGoBack ? (
          <ArrowLeft
            className="absolute h-4 w-4 text-m3-text opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            aria-hidden
          />
        ) : null}
        <img
          src="/favicon.png"
          alt=""
          className={`h-5 w-5 rounded-md object-contain transition-opacity duration-150 ${
            canGoBack ? "group-hover:opacity-0" : ""
          }`}
        />
      </span>
      <span className="text-xs font-semibold tracking-tight sm:text-sm">{t("brand.name")}</span>
    </>
  );

  return (
    <div className="min-h-dvh w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <LoadingBar active={isRefreshing} />

      <header className="sticky top-0 z-30 border-b border-m3-border/70 bg-m3-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {canGoBack && returnUrl ? (
            <a
              href={returnUrl}
              className={brandPillClass}
              title={t("common.back")}
              aria-label={t("common.back")}
            >
              {brandContent}
            </a>
          ) : (
            <Link href="/account" className={brandPillClass} prefetch>
              {brandContent}
            </Link>
          )}

          <div className="flex items-center gap-2">
            {headerActions}
            <LanguageSelector />
            <ThemeToggle className="bg-m3-sidebar/80 hover:bg-m3-hover" />
          </div>
        </div>
      </header>

      <AccountToastBanner toast={toast} />

      <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>

      <footer className="mt-auto w-full border-t border-m3-border/60">
        <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-caption sm:px-6 lg:px-8">
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

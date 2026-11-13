"use client";

import { AuthAccountMenu } from "@/components/account/AuthAccountMenu";
import { AccountToastBanner } from "@/components/account/AccountToast";
import { NavigationProgress } from "@/components/account/NavigationProgress";
import { AuthLogosToggle } from "@/components/logos/AuthLogosProvider";
import { AuthAppSwitcher } from "@/components/suite/AuthAppSwitcher";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
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
  /** @deprecated Logos + account menu are built into the shell. */
  headerActions?: ReactNode;
}) {
  const { t } = useI18n();
  const { isRefreshing } = useActiveOrganization();
  const canGoBack = Boolean(returnUrl);
  void headerActions;

  const brandPillClass =
    "group relative flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-sidebar/80 px-2.5 py-1.5 transition-colors hover:bg-m3-hover";

  const swapMotion =
    "absolute inset-0 flex items-center transition-[opacity,translate] duration-200 ease-out";

  const brandContent = canGoBack ? (
    <>
      <span className="relative h-5 w-5 shrink-0 overflow-hidden">
        <span
          className={`${swapMotion} justify-center -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100`}
          aria-hidden
        >
          <ArrowLeft className="h-4 w-4 text-m3-text" />
        </span>
        <span className={`${swapMotion} z-10 justify-center group-hover:opacity-0`}>
          <img src="/favicon.png" alt="" className="h-5 w-5 object-contain" />
        </span>
      </span>
      <span className="relative inline-grid overflow-hidden text-xs font-semibold tracking-tight sm:text-sm">
        <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
          {t("brand.name")}
        </span>
        <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
          {t("common.back")}
        </span>
        <span
          className={`${swapMotion} -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100`}
        >
          {t("common.back")}
        </span>
        <span className={`${swapMotion} z-10 group-hover:opacity-0`}>{t("brand.name")}</span>
      </span>
    </>
  ) : (
    <>
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <img src="/favicon.png" alt="" className="h-5 w-5 object-contain" />
      </span>
      <span className="text-xs font-semibold tracking-tight sm:text-sm">{t("brand.name")}</span>
    </>
  );

  return (
    <div className="min-h-full w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
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
            <Link href="/home" className={brandPillClass} prefetch>
              {brandContent}
            </Link>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1">
            <AuthLogosToggle />
            <AuthAppSwitcher currentAppId="auth" />
            <AuthAccountMenu />
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

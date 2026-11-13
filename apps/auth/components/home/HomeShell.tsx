"use client";

import { AuthAccountMenu } from "@/components/account/AuthAccountMenu";
import { NavigationProgress } from "@/components/account/NavigationProgress";
import { AuthLogosToggle } from "@/components/logos/AuthLogosProvider";
import { AuthAppSwitcher } from "@/components/suite/AuthAppSwitcher";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import { LoadingBar } from "@hosanna/ui";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

/** Header-only chrome for `/home` (no account sidebar). */
export function HomeShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isRefreshing } = useActiveOrganization();

  return (
    <div className="min-h-full w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <LoadingBar active={isRefreshing} />

      <header className="sticky top-0 z-30 border-b border-m3-border/60 bg-m3-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/home"
            className="group relative flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-sidebar/70 px-2.5 py-1.5 transition-colors hover:bg-m3-hover"
            prefetch
          >
            <img src="/favicon.png" alt="" className="h-5 w-5 object-contain" />
            <span className="text-xs font-semibold tracking-tight sm:text-sm">
              {t("brand.name")}
            </span>
          </Link>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <AuthLogosToggle />
            <AuthAppSwitcher currentAppId="auth" />
            <AuthAccountMenu />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--color-m3-primary)_14%,transparent),_transparent_70%)]"
          aria-hidden
        />
        {children}
      </main>

      <footer className="mt-auto w-full border-t border-m3-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-caption sm:px-6 lg:px-8">
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

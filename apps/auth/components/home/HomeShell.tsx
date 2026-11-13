"use client";

import { AuthAccountMenu } from "@/components/account/AuthAccountMenu";
import { NavigationProgress } from "@/components/account/NavigationProgress";
import { BrandMark } from "@/components/BrandMark";
import { AuthLogosToggle } from "@/components/logos/AuthLogosProvider";
import { AuthAppSwitcher } from "@/components/suite/AuthAppSwitcher";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import { LoadingBar } from "@hosanna/ui";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

/** Header-only chrome for `/home` (no account sidebar). */
export function HomeShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isRefreshing } = useActiveOrganization();

  return (
    <div className="relative min-h-full w-full flex flex-col overflow-x-hidden bg-m3-bg text-m3-text font-sans antialiased selection:bg-m3-primary/20">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <Image
          src="/background.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 opacity-35 blur-[2px] transition-opacity duration-700 dark:opacity-25"
        />
        <div className="absolute inset-0 bg-linear-to-b from-m3-bg/75 via-m3-bg/88 to-m3-sidebar/95 dark:from-m3-bg/88 dark:via-m3-bg/94 dark:to-m3-bg/98" />
      </div>

      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <LoadingBar active={isRefreshing} />

      <header className="relative z-30 sticky top-0 border-b border-m3-border/50 bg-m3-card/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/home"
            className="group relative flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-card/80 px-2.5 py-1.5 shadow-xs transition-colors hover:bg-m3-hover"
            prefetch
          >
            <BrandMark />
            <span className="text-xs font-semibold tracking-tight sm:text-sm">
              {t("brand.name")}
            </span>
          </Link>

          <div className="flex h-9 items-center gap-0.5 sm:gap-1">
            <AuthLogosToggle />
            <AuthAppSwitcher currentAppId="auth" />
            <AuthAccountMenu />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-m3-border/50 bg-m3-card/40 backdrop-blur-md">
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

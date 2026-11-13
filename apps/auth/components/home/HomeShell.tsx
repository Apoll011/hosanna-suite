"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OrgSwitcher } from "@/components/account/OrgSwitcher";
import { NavigationProgress } from "@/components/account/NavigationProgress";
import { AuthAppSwitcher } from "@/components/suite/AuthAppSwitcher";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth/client";
import { clearCachedOrg } from "@/lib/organization/cache";
import { clearCachedUser } from "@/lib/session/cache";
import { useI18n } from "@/lib/ui/i18n";
import { LoadingBar } from "@hosanna/ui";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const HOME_NAV = [
  { href: "/account", labelKey: "home.nav.account" as const },
  { href: "/account/organization", labelKey: "home.nav.organization" as const },
] as const;

/** Header-only chrome for `/home` (no account sidebar). */
export function HomeShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const { user, clear } = useAuthUser({ loginRedirect: "/login?redirect=/home" });
  const { isRefreshing } = useActiveOrganization();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const logout = async () => {
    clear();
    clearCachedUser();
    clearCachedOrg();
    await authClient.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-m3-bg text-m3-text font-sans antialiased">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <LoadingBar active={isRefreshing} />

      <header className="sticky top-0 z-30 border-b border-m3-border/70 bg-m3-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/home"
              className="group relative flex select-none items-center gap-2 rounded-full border border-m3-border/60 bg-m3-sidebar/80 px-2.5 py-1.5 transition-colors hover:bg-m3-hover"
              prefetch
            >
              <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md object-contain" />
              <span className="text-xs font-semibold tracking-tight sm:text-sm">
                {t("brand.name")}
              </span>
            </Link>
            <div className="hidden min-w-0 sm:block">
              <OrgSwitcher />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <AuthAppSwitcher currentAppId="auth" />
            <LanguageSelector />
            <ThemeToggle className="bg-m3-sidebar/80 hover:bg-m3-hover" />

            <div ref={menuRef} className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-m3-border/60 bg-m3-sidebar/80 px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-m3-hover"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-m3-primary/15 text-[11px] font-bold text-m3-primary">
                  {user?.image ? (
                    <img src={user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user?.name?.trim().charAt(0) || user?.email?.charAt(0) || "?").toUpperCase()
                  )}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-m3-secondary" aria-hidden />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-m3-border/70 bg-m3-card shadow-lg"
                >
                  <div className="border-b border-m3-border/60 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-m3-text">
                      {user?.name || user?.email}
                    </p>
                    {user?.name && user?.email ? (
                      <p className="truncate text-[11px] text-m3-secondary">{user.email}</p>
                    ) : null}
                  </div>
                  <div className="p-1">
                    {HOME_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-m3-text hover:bg-m3-hover"
                        onClick={() => setMenuOpen(false)}
                      >
                        <UserRound className="h-3.5 w-3.5 text-m3-secondary" aria-hidden />
                        {t(item.labelKey)}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-m3-text hover:bg-m3-hover"
                      onClick={() => void logout()}
                    >
                      <LogOut className="h-3.5 w-3.5 text-m3-secondary" aria-hidden />
                      {t("account.signOut")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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

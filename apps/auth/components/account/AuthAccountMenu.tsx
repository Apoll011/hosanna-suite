"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authClient } from "@/lib/auth/client";
import { clearCachedOrg } from "@/lib/organization/cache";
import { clearCachedUser } from "@/lib/session/cache";
import { useI18n } from "@/lib/ui/i18n";
import { AccountMenu } from "@hosanna/ui";
import { Building2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Auth-wired Google-style account menu (theme, language, org switcher). */
export function AuthAccountMenu({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { user, clear } = useAuthUser({ requireAuth: false, loginRedirect: "/login?redirect=/home" });
  const { organization, organizations, switchOrganization } = useActiveOrganization();

  const logout = async () => {
    clear();
    clearCachedUser();
    clearCachedOrg();
    await authClient.signOut();
    router.replace("/login");
  };

  return (
    <AccountMenu
      className={className}
      user={user}
      organization={
        organization
          ? {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              logo: organization.logo,
            }
          : null
      }
      organizations={organizations.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
      }))}
      onSwitchOrganization={async (org) => {
        const match = organizations.find((o) => o.id === org.id);
        if (match) await switchOrganization(match);
      }}
      links={[
        {
          href: "/account",
          label: t("home.nav.account"),
          icon: <UserRound className="h-4 w-4 text-m3-secondary" aria-hidden />,
        },
        {
          href: "/account/organization",
          label: t("home.nav.organization"),
          icon: <Building2 className="h-4 w-4 text-m3-secondary" aria-hidden />,
        },
      ]}
      renderLink={(link, className, onNavigate) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          role="menuitem"
          className={className}
          onClick={onNavigate}
          prefetch
        >
          {link.icon}
          {link.label}
        </Link>
      )}
      onSignOut={logout}
      labels={{
        openMenu: t("account.menu.open"),
        account: t("account.nav.home"),
        signOut: t("account.signOut"),
        organization: t("accountOrg.switcher.label"),
        switchOrganization: t("accountOrg.switcher.switch"),
        theme: t("account.menu.theme"),
        language: t("account.menu.language"),
      }}
      themeControl={
        <div className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2">
          <span className="text-sm text-m3-text">{t("account.menu.theme")}</span>
          <ThemeToggle className="border-m3-border/50 bg-m3-sidebar/60 hover:bg-m3-hover" />
        </div>
      }
      languageControl={
        <div className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2">
          <span className="text-sm text-m3-text">{t("account.menu.language")}</span>
          <LanguageSelector className="[&_button]:bg-m3-sidebar/60 [&_button]:shadow-none [&_button]:p-2" />
        </div>
      }
    />
  );
}

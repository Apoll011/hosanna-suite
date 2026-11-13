"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { MenuThemeToggle } from "@/components/account/MenuThemeToggle";
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

  const prefsRow =
    "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-m3-text";

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
        <div className={prefsRow}>
          <span className="font-medium">{t("account.menu.theme")}</span>
          <MenuThemeToggle />
        </div>
      }
      languageControl={
        <div className={prefsRow}>
          <span className="font-medium">{t("account.menu.language")}</span>
          <LanguageSelector className="[&_button]:h-7 [&_button]:gap-1 [&_button]:rounded-full [&_button]:border-m3-border/50 [&_button]:bg-m3-sidebar/70 [&_button]:p-1.5 [&_button]:shadow-none [&_button]:text-[10px]" />
        </div>
      }
    />
  );
}

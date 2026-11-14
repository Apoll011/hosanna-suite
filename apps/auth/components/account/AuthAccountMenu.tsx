"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authClient } from "@/lib/auth/client";
import { clearCachedOrg } from "@/lib/organization/cache";
import { clearCachedUser } from "@/lib/session/cache";
import { useI18n } from "@/lib/ui/i18n";
import { useTheme } from "@/lib/ui/theme";
import { AccountMenu } from "@hosanna/ui";
import { Building2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Auth-wired Google-style account menu (theme, language, org switcher). */
export function AuthAccountMenu({ className }: { className?: string }) {
  const { t, language } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, clear } = useAuthUser({
    requireAuth: false,
    loginRedirect: "/login?redirect=/home",
  });
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
      language={language}
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
          label: t("suite.accountMenu.account"),
          icon: <UserRound className="h-4 w-4 text-m3-secondary" aria-hidden />,
        },
        {
          href: "/account/organization",
          label: t("suite.accountMenu.organization"),
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
      theme={{ value: theme, onChange: setTheme }}
      languageControl={<LanguageSelector variant="menu" />}
    />
  );
}

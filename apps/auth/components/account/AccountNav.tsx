"use client";

import { OrgSwitcher } from "@/components/account/OrgSwitcher";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import type { AppRole, PermissionString } from "@hosanna/auth";
import { AnyRoleGate, Can, CanAny } from "@hosanna/ui";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  CreditCard,
  Database,
  MapPin,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ComponentType, type MouseEvent, type ReactNode } from "react";

type NavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

type OrgNavItem = NavItem & {
  permission?: PermissionString;
  anyPermissions?: PermissionString[];
  /** If set, require one of these roles (e.g. login activity). */
  anyRoles?: AppRole[];
};

const PERSONAL_ITEMS: NavItem[] = [
  { href: "/account", labelKey: "account.nav.home", icon: User, exact: true },
];

const ORG_ITEMS: OrgNavItem[] = [
  { href: "/account/organization/profile", labelKey: "account.nav.profile", icon: Building2 },
  { href: "/account/organization/members", labelKey: "account.nav.members", icon: Users },
  {
    href: "/account/organization/billing",
    labelKey: "account.nav.billing",
    icon: CreditCard,
    permission: "billing.access",
  },
  {
    href: "/account/organization/notifications",
    labelKey: "account.nav.notifications",
    icon: Bell,
    permission: "notification.sent",
  },
  {
    href: "/account/organization/ai",
    labelKey: "account.nav.ai",
    icon: Bot,
    permission: "ai.manage",
  },
  {
    href: "/account/organization/regional",
    labelKey: "account.nav.regional",
    icon: MapPin,
    permission: "organization.update",
  },
  {
    href: "/account/organization/activity",
    labelKey: "account.nav.activity",
    icon: Activity,
    anyRoles: ["owner", "admin"],
  },
  {
    href: "/account/organization/data",
    labelKey: "account.nav.data",
    icon: Database,
    anyPermissions: ["backup.export", "backup.import"],
  },
];

function usePreservedSearch() {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.search || "";
  }, []);
}

function isActivePath(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({ item, search, active }: { item: NavItem; search: string; active: boolean }) {
  const { t } = useI18n();
  const Icon = item.icon;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (active) e.preventDefault();
  };

  return (
    <Link
      href={`${item.href}${search}`}
      prefetch
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:text-sm ${
        active
          ? "bg-m3-primary/10 text-m3-primary"
          : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{t(item.labelKey)}</span>
    </Link>
  );
}

function PermissionGate({ item, children }: { item: OrgNavItem; children: ReactNode }) {
  if (item.anyRoles?.length) {
    return <AnyRoleGate roles={item.anyRoles}>{children}</AnyRoleGate>;
  }
  if (item.anyPermissions?.length) {
    return <CanAny permissions={item.anyPermissions}>{children}</CanAny>;
  }
  if (item.permission) {
    return <Can permission={item.permission}>{children}</Can>;
  }
  return <>{children}</>;
}

/** Google-accounts style left sidebar (fixed on desktop while content scrolls). */
export function AccountNav({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const pathname = usePathname() || "/account";
  const search = usePreservedSearch();
  const { organization, organizations } = useActiveOrganization();
  const showOrgNav = Boolean(organization) || organizations.length > 0;

  const renderOrgLinks = () =>
    ORG_ITEMS.map((item) => (
      <PermissionGate key={item.href} item={item}>
        <NavLink item={item} search={search} active={isActivePath(pathname, item)} />
      </PermissionGate>
    ));

  return (
    <nav
      className={`w-full shrink-0 md:fixed md:top-[4.25rem] md:left-6 md:z-20 md:max-h-[calc(100dvh-4.25rem)] md:w-56 md:overflow-y-auto md:overscroll-contain lg:left-8 lg:w-60 ${className}`}
      aria-label={t("account.nav.ariaLabel")}
    >
      <div className="md:hidden space-y-2">
        {showOrgNav ? <OrgSwitcher /> : null}
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-min items-stretch gap-1 px-1">
            {PERSONAL_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                search={search}
                active={isActivePath(pathname, item)}
              />
            ))}
            {showOrgNav ? (
              <>
                <span className="mx-1 w-px shrink-0 self-stretch bg-m3-border/70" aria-hidden />
                {renderOrgLinks()}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:flex-col md:gap-6 md:pb-6">
        <div>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
            {t("account.nav.personal")}
          </p>
          <div className="flex flex-col gap-0.5">
            {PERSONAL_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                search={search}
                active={isActivePath(pathname, item)}
              />
            ))}
          </div>
        </div>

        {showOrgNav ? (
          <div>
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
              {t("account.nav.organization")}
            </p>
            <div className="mb-2 px-0.5">
              <OrgSwitcher />
            </div>
            <div className="flex flex-col gap-0.5">{renderOrgLinks()}</div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

"use client";

import { OrgSwitcher } from "@/components/account/OrgSwitcher";
import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  CreditCard,
  Database,
  Globe2,
  LayoutDashboard,
  MapPin,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ComponentType } from "react";

type NavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: ComponentType<{ className?: string }>;
  /** Exact match only (personal home). */
  exact?: boolean;
};

const PERSONAL_ITEMS: NavItem[] = [
  { href: "/account", labelKey: "account.nav.home", icon: User, exact: true },
];

const ORG_ITEMS: NavItem[] = [
  {
    href: "/account/organization",
    labelKey: "account.nav.overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/account/organization/profile", labelKey: "account.nav.profile", icon: Building2 },
  { href: "/account/organization/members", labelKey: "account.nav.members", icon: Users },
  { href: "/account/organization/billing", labelKey: "account.nav.billing", icon: CreditCard },
  {
    href: "/account/organization/notifications",
    labelKey: "account.nav.notifications",
    icon: Bell,
  },
  { href: "/account/organization/ai", labelKey: "account.nav.ai", icon: Bot },
  { href: "/account/organization/regional", labelKey: "account.nav.regional", icon: MapPin },
  { href: "/account/organization/activity", labelKey: "account.nav.activity", icon: Activity },
  { href: "/account/organization/data", labelKey: "account.nav.data", icon: Database },
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
  return (
    <Link
      href={`${item.href}${search}`}
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

/** Google-accounts style left sidebar (horizontal scroll on small screens). */
export function AccountNav({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const pathname = usePathname() || "/account";
  const search = usePreservedSearch();
  const inOrgSection = pathname.startsWith("/account/organization");

  return (
    <nav
      className={`w-full md:w-56 lg:w-60 shrink-0 ${className}`}
      aria-label={t("account.nav.ariaLabel")}
    >
      {/* Mobile: switcher + horizontal chip strip */}
      <div className="md:hidden space-y-2">
        {inOrgSection ? <OrgSwitcher /> : null}
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
            <span className="mx-1 w-px shrink-0 self-stretch bg-m3-border/70" aria-hidden />
            {ORG_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                search={search}
                active={isActivePath(pathname, item)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:gap-6">
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

        <div>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
            {t("account.nav.organization")}
          </p>
          {inOrgSection ? (
            <div className="mb-2 px-0.5">
              <OrgSwitcher />
            </div>
          ) : (
            <Link
              href={`/account/organization${search}`}
              className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-m3-secondary hover:bg-m3-hover hover:text-m3-text transition-colors"
            >
              <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t("account.nav.openOrganization")}</span>
            </Link>
          )}
          <div className="flex flex-col gap-0.5">
            {ORG_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                search={search}
                active={isActivePath(pathname, item)}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

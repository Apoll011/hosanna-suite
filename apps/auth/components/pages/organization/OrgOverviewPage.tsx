"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { OrgSwitcher } from "@/components/account/OrgSwitcher";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { getStudioUrl } from "@/lib/redirect";
import { Button, PageHeader, Spinner, Surface } from "@hosanna/ui";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  CreditCard,
  Database,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

type QuickLink = {
  href: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: ComponentType<{ className?: string }>;
};

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/account/organization/profile",
    labelKey: "account.nav.profile",
    descKey: "accountOrg.profile.description",
    icon: Building2,
  },
  {
    href: "/account/organization/members",
    labelKey: "account.nav.members",
    descKey: "accountOrg.members.description",
    icon: Users,
  },
  {
    href: "/account/organization/billing",
    labelKey: "account.nav.billing",
    descKey: "accountOrg.billing.description",
    icon: CreditCard,
  },
  {
    href: "/account/organization/notifications",
    labelKey: "account.nav.notifications",
    descKey: "accountOrg.notifications.description",
    icon: Bell,
  },
  {
    href: "/account/organization/ai",
    labelKey: "account.nav.ai",
    descKey: "accountOrg.ai.description",
    icon: Bot,
  },
  {
    href: "/account/organization/regional",
    labelKey: "account.nav.regional",
    descKey: "accountOrg.regional.description",
    icon: MapPin,
  },
  {
    href: "/account/organization/activity",
    labelKey: "account.nav.activity",
    descKey: "accountOrg.activity.description",
    icon: Activity,
  },
  {
    href: "/account/organization/data",
    labelKey: "account.nav.data",
    descKey: "accountOrg.data.description",
    icon: Database,
  },
];

export function OrgOverviewPage() {
  const { t } = useI18n();
  const { organization, organizations, isLoading, error } = useActiveOrganization();

  return (
    <AccountCenter>
      <PageHeader
        title={t("accountOrg.overview.title")}
        description={t("accountOrg.overview.description")}
      />

      {isLoading && !organization ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label={t("accountOrg.loading")} />
        </div>
      ) : null}

      {!isLoading && !organization ? (
        <Surface>
          <h2 className="text-sm font-semibold text-m3-text mb-1">{t("accountOrg.empty.title")}</h2>
          <p className="text-sm text-m3-secondary mb-4">{t("accountOrg.empty.description")}</p>
          <Link
            href="/onboarding"
            className="text-sm font-semibold text-m3-primary hover:underline"
          >
            {t("accountOrg.empty.cta")}
          </Link>
        </Surface>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-m3-danger" role="alert">
          {error}
        </p>
      ) : null}

      {organization ? (
        <div className="space-y-6 pb-8">
          <Surface>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-m3-border/60 bg-m3-primary/10 text-m3-primary flex items-center justify-center text-lg font-semibold">
                  {organization.logo ? (
                    <img src={organization.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (organization.name.trim().charAt(0) || "·").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-label mb-0.5">{t("accountOrg.overview.currentOrg")}</p>
                  <h2 className="text-title text-m3-text truncate">{organization.name}</h2>
                  <p className="text-caption truncate">@{organization.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight className="h-4 w-4" />}
                  onClick={() => {
                    window.location.assign(`${getStudioUrl()}/${organization.slug}`);
                  }}
                >
                  {t("accountOrg.overview.openStudio")}
                </Button>
              </div>
            </div>

            {organizations.length > 1 ? (
              <div className="mt-5 pt-5 border-t border-m3-border max-w-sm">
                <p className="text-label mb-2">{t("accountOrg.switcher.switch")}</p>
                <OrgSwitcher />
              </div>
            ) : null}
          </Surface>

          <div>
            <h3 className="text-sm font-semibold text-m3-text mb-3">
              {t("accountOrg.overview.quickLinks")}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 -mx-2 hover:bg-m3-hover transition-colors"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-m3-sidebar border border-m3-border/60 text-m3-secondary group-hover:text-m3-primary transition-colors">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-m3-text group-hover:text-m3-primary transition-colors">
                          {t(link.labelKey)}
                        </span>
                        <span className="block text-caption text-m3-secondary line-clamp-2">
                          {t(link.descKey)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </AccountCenter>
  );
}

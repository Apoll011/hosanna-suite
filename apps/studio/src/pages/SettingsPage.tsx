/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageHeader, Tabs, useCan } from "@hosanna/ui";
import { navigateToAuthAccount } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";

import { isDemoMode } from "@/src/demo";
import { AppWindow, Church, CloudOff, Info, Printer, Users, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AboutTab } from "../components/settings/AboutTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { FeaturesTab } from "../components/settings/FeaturesTab";
import { PrintingTab } from "../components/settings/PrintingTab";
import { ResponsibilitiesTab } from "../components/settings/ResponsibilitiesTab";
import { ServiceBehaviorTab } from "../components/settings/ServiceBehaviorTab";
import { useSync } from "../contexts/SyncContext";
import { useOnline } from "../hooks/useOnline";

type TabType = "app" | "services" | "printing" | "responsibilities" | "features" | "about";

const VALID_TABS: TabType[] = [
  "app",
  "services",
  "printing",
  "responsibilities",
  "features",
  "about",
];

const NETWORK_TABS: TabType[] = ["services", "printing", "responsibilities"];

/** Old bookmarks that now live under another Settings tab. */
const SETTINGS_TAB_ALIASES: Record<string, TabType> = {
  durations: "services",
};

/** Legacy Settings bookmarks that now live on auth. */
const MOVED_TO_AUTH: Record<string, string> = {
  account: "/account",
  workspace: "/account/organization/profile",
  members: "/account/organization/members",
  billing: "/account/organization/billing",
  general: "/account/organization/regional",
  loginActivity: "/account/organization/activity",
  notifications: "/account/organization/notifications",
  ai: "/account/organization/ai",
};

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnline();
  const { showToast } = useSync();
  const [searchParams, setSearchParams] = useSearchParams();

  const { granted: canUpdate } = useCan("organization.update");

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (VALID_TABS.includes(initialTab as TabType)) return initialTab as TabType;
    return "app";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;

    const alias = SETTINGS_TAB_ALIASES[tab];
    if (alias) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", alias);
      setSearchParams(next, { replace: true });
      setActiveTab(alias);
      return;
    }

    const authPath = MOVED_TO_AUTH[tab];
    if (!authPath) return;

    // Demo has no auth account surface — drop legacy tabs onto Application.
    if (isDemoMode()) {
      setActiveTab("app");
      const next = new URLSearchParams(searchParams);
      next.set("tab", "app");
      setSearchParams(next, { replace: true });
      return;
    }

    navigateToAuthAccount({
      path: authPath,
      returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  // Org-managed tabs require organization.update; drop users without it.
  useEffect(() => {
    const orgTabs: TabType[] = ["services", "printing", "responsibilities"];
    if (orgTabs.includes(activeTab) && !canUpdate) {
      setActiveTab("app");
      const next = new URLSearchParams(searchParams);
      next.set("tab", "app");
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, canUpdate, searchParams, setSearchParams]);

  const tabs = [
    {
      id: "app" as const,
      label: t("settings.tabs.app"),
      icon: <AppWindow className="w-4 h-4" />,
      requiresNetwork: false,
      show: true,
    },
    {
      id: "services" as const,
      label: t("settings.tabs.services"),
      icon: <Church className="w-4 h-4" />,
      requiresNetwork: true,
      show: canUpdate,
    },
    {
      id: "printing" as const,
      label: t("settings.tabs.printing"),
      icon: <Printer className="w-4 h-4" />,
      requiresNetwork: true,
      show: canUpdate,
    },
    {
      id: "responsibilities" as const,
      label: t("settings.tabs.responsibilities"),
      icon: <Users className="w-4 h-4" />,
      requiresNetwork: true,
      show: canUpdate,
    },
    {
      id: "features" as const,
      label: t("settings.tabs.features"),
      icon: <Zap className="w-4 h-4" />,
      requiresNetwork: false,
      show: true,
    },
    {
      id: "about" as const,
      label: t("settings.tabs.about"),
      icon: <Info className="w-4 h-4" />,
      requiresNetwork: false,
      show: true,
    },
  ];

  const tabItems = tabs
    .filter((tab) => tab.show)
    .map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      disabled: !isOnline && tab.requiresNetwork,
    }));

  return (
    <div className="h-full w-full overflow-y-auto bg-m3-bg text-m3-text p-6">
      <div className="w-full space-y-6">
        <PageHeader title={t("common.settings")} description={t("settings.pageDesc")} />

        {!isOnline && (
          <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 text-xs">
            <CloudOff className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <span className="font-semibold block">{t("settings.offlineTitle")}</span>
              <span className="opacity-90">{t("settings.offlineDesc")}</span>
            </div>
          </div>
        )}

        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={(id) => {
            const nextId = id as TabType;
            setActiveTab(nextId);
            const next = new URLSearchParams(searchParams);
            next.set("tab", nextId);
            setSearchParams(next, { replace: true });
          }}
          aria-label={t("common.settings")}
        />

        <div
          className={`pt-2 pb-12 ${
            !isOnline && NETWORK_TABS.includes(activeTab)
              ? "opacity-40 pointer-events-none select-none filter grayscale"
              : ""
          }`}
        >
          <AppearanceTab active={activeTab === "app"} />
          <ServiceBehaviorTab active={activeTab === "services"} showToast={showToast} />
          <PrintingTab active={activeTab === "printing"} showToast={showToast} />
          <ResponsibilitiesTab active={activeTab === "responsibilities"} showToast={showToast} />
          <FeaturesTab active={activeTab === "features"} />
          <AboutTab active={activeTab === "about"} />
        </div>
      </div>
    </div>
  );
};

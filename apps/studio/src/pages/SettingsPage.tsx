/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageHeader, Tabs } from "@/src/components/common";
import { navigateToAuthAccount } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";
import { AppWindow, CloudOff, Info, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AboutTab } from "../components/settings/AboutTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { FeaturesTab } from "../components/settings/FeaturesTab";
import { useOnline } from "../hooks/useOnline";

type TabType = "app" | "features" | "about";

const VALID_TABS: TabType[] = ["app", "features", "about"];

/** Org tabs that now live on `/organization` — redirect for old bookmarks. */
const MOVED_TO_ORGANIZATION = new Set([
  "workspace",
  "members",
  "notifications",
  "billing",
  "general",
  "loginActivity",
]);

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnline();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab");

  useEffect(() => {
    const tab = searchParams.get("tab");
    // Account lives on auth.hosanna.live — hard-navigate immediately.
    if (tab === "account") {
      navigateToAuthAccount({
        returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      return;
    }
    if (!tab || !MOVED_TO_ORGANIZATION.has(tab) || !slug) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    navigate(`/${slug}/organization?${next.toString()}`, { replace: true });
  }, [searchParams, slug, navigate]);

  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(initialTab as TabType) ? (initialTab as TabType) : "app",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  const tabs = [
    {
      id: "app" as const,
      label: t("settings.tabs.app"),
      icon: <AppWindow className="w-4 h-4" />,
      requiresNetwork: false,
      show: true,
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
        <PageHeader title={t("common.settings")} />

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

        <div className="pt-2 pb-12">
          <AppearanceTab active={activeTab === "app"} />
          <FeaturesTab active={activeTab === "features"} />
          <AboutTab active={activeTab === "about"} />
        </div>
      </div>
    </div>
  );
};

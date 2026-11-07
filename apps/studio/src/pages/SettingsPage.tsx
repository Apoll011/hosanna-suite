/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageHeader, Tabs } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { AppWindow, CloudOff, Info, User, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AboutTab } from "../components/settings/AboutTab";
import { AccountTab } from "../components/settings/AccountTab";
import { AppearanceTab } from "../components/settings/AppearanceTab";
import { FeaturesTab } from "../components/settings/FeaturesTab";
import { useOnline } from "../hooks/useOnline";

type TabType = "account" | "app" | "features" | "about";

const VALID_TABS: TabType[] = ["account", "app", "features", "about"];

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
    if (!tab || !MOVED_TO_ORGANIZATION.has(tab) || !slug) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    navigate(`/${slug}/organization?${next.toString()}`, { replace: true });
  }, [searchParams, slug, navigate]);

  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(initialTab as TabType)
      ? (initialTab as TabType)
      : "account",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  const tabs = [
    {
      id: "account" as const,
      label: t("settings.tabs.account"),
      icon: <User className="w-4 h-4" />,
      requiresNetwork: true,
      show: true,
    },
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
    <div className="h-full w-full overflow-y-auto bg-m3-bg text-m3-text p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title={t("common.settings")} />

        {!isOnline && (
          <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-lg)] text-amber-700 dark:text-amber-300 text-xs">
            <CloudOff className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <span className="font-semibold block">
                {t("settings.offlineTitle")}
              </span>
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
          <div
            className={
              !isOnline && activeTab === "account"
                ? "opacity-40 pointer-events-none select-none filter grayscale transition-opacity"
                : ""
            }
          >
            <AccountTab active={activeTab === "account"} />
          </div>
          <AppearanceTab active={activeTab === "app"} />
          <FeaturesTab active={activeTab === "features"} />
          <AboutTab active={activeTab === "about"} />
        </div>
      </div>
    </div>
  );
};

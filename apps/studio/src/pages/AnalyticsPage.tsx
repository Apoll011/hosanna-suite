/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LibraryHealthTab } from "@/src/components/analytics/LibraryHealthTab";
import { SetlistInsightsTab } from "@/src/components/analytics/SetlistInsightsTab";
import { UsageOverviewTab } from "@/src/components/analytics/UsageOverviewTab";
import { PageHeader, Tabs } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Gauge, HeartPulse, ListMusic } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

type TabType = "usage" | "setlist" | "libraryHealth";

const VALID_TABS: TabType[] = ["usage", "setlist", "libraryHealth"];

export const AnalyticsPage: React.FC = () => {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { granted: canViewHealth, loading: permLoading } =
    useCan("library.health");

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    VALID_TABS.includes(initialTab as TabType)
      ? (initialTab as TabType)
      : "usage",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (VALID_TABS.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, activeTab]);

  if (permLoading) {
    return null;
  }

  if (!canViewHealth) {
    return <Navigate to={slug ? `/${slug}/folders` : "/"} replace />;
  }

  const tabItems = [
    {
      id: "usage",
      label: t("analytics.tabs.usage"),
      icon: <Gauge className="w-4 h-4" />,
    },
    {
      id: "setlist",
      label: t("analytics.tabs.setlist"),
      icon: <ListMusic className="w-4 h-4" />,
    },
    {
      id: "libraryHealth",
      label: t("analytics.tabs.libraryHealth"),
      icon: <HeartPulse className="w-4 h-4" />,
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-m3-bg text-m3-text p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title={t("analytics.title")}
          description={t("analytics.desc")}
        />

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
          aria-label={t("analytics.title")}
        />

        <div className="pt-2 pb-12">
          <UsageOverviewTab active={activeTab === "usage"} />
          <SetlistInsightsTab active={activeTab === "setlist"} />
          <LibraryHealthTab active={activeTab === "libraryHealth"} />
        </div>
      </div>
    </div>
  );
};

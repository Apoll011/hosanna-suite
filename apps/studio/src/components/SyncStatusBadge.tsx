import { useI18n } from "@/src/lib/i18n";
import { AlertCircle, Cloud, CloudOff, RefreshCw } from "lucide-react";
import React from "react";
import { useSync } from "../contexts/SyncContext";

interface SyncStatusBadgeProps {
  className?: string;
  showText?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  className = "",
  showText = false,
}) => {
  const { syncStatus, triggerSyncCheck, lastSyncedAt } = useSync();
  const { t } = useI18n();

  const getStatusConfig = () => {
    switch (syncStatus) {
      case "syncing":
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />,
          label: t("misc.syncStatus.syncing"),
          tooltip: t("misc.syncStatus.syncingTooltip"),
          bgClass: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        };
      case "offline":
        return {
          icon: <CloudOff className="w-4 h-4 text-amber-500" />,
          label: t("misc.syncStatus.offline"),
          tooltip: t("misc.syncStatus.offlineTooltip"),
          bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          label: t("misc.syncStatus.error"),
          tooltip: t("misc.syncStatus.errorTooltip"),
          bgClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
      case "synced":
      default:
        return {
          icon: <Cloud className="w-4 h-4 text-emerald-500" />,
          label: t("misc.syncStatus.synced"),
          tooltip: lastSyncedAt
            ? t("misc.syncStatus.syncedTooltip", {
                time: lastSyncedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
            : t("misc.syncStatus.syncedTooltipNoTime"),
          bgClass:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={() => void triggerSyncCheck()}
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 text-xs font-medium ${config.bgClass} ${className}`}
    >
      {config.icon}
      {showText && <span>{config.label}</span>}
    </button>
  );
};

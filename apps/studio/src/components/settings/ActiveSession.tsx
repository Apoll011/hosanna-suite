import { useSync } from "@/src/contexts/SyncContext";
import { authClient } from "@/src/lib/authClient";
import { useI18n } from "@/src/lib/i18n";
import { DeviceType, parseUserAgent } from "@/src/lib/parseUserAgent";
import { Session } from "better-auth";
import {
  Globe,
  Loader2,
  Monitor,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DEVICE_ICONS: Record<DeviceType, typeof Globe> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Globe,
};

export const ActiveSessionsSection: React.FC = () => {
  const { showToast } = useSync();
  const { t } = useI18n();

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authClient.listSessions({ query: {} });
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const refetch = fetchSessions;

  const handleRevoke = async (token: string) => {
    try {
      await authClient.revokeSession({ token });
      showToast(t("settings.account.activeSessions.revokeSuccess"), "success");
      refetch();
    } catch {
      showToast(t("settings.account.activeSessions.revokeError"), "error");
    }
  };

  return (
    <div className="bg-m3-card border border-m3-border rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-m3-text flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-m3-secondary" />
            {t("settings.account.activeSessions.title")}
          </h3>
          <p className="text-xs text-m3-secondary mt-0.5">
            {t("settings.account.activeSessions.desc")}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 text-m3-secondary hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-m3-hover transition-colors"
          title={t("settings.account.activeSessions.refreshTitle")}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-m3-secondary flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
          {t("settings.account.activeSessions.loading")}
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map(
            (
              sess: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
              },
              idx: number,
            ) => {
              const info = parseUserAgent(sess.userAgent);
              const DeviceIcon = DEVICE_ICONS[info.deviceType];
              const clientLabel = info.isApp
                ? t("settings.account.activeSessions.nativeApp", {
                    name: info.client ?? "",
                  })
                : info.client;
              const sessionTitle = [clientLabel, info.os, info.device]
                .filter((part): part is string => Boolean(part))
                .join(" · ");
              const title =
                sessionTitle ||
                sess.userAgent ||
                t("settings.account.activeSessions.browserSession");

              return (
                <div
                  key={sess.id || idx}
                  className="p-3 bg-m3-sidebar rounded-xl border border-m3-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-m3-card rounded-lg border border-m3-border shrink-0">
                      <DeviceIcon className="w-4 h-4 text-m3-primary" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-bold text-m3-text truncate"
                        title={sess.userAgent ?? undefined}
                      >
                        {title}
                      </p>
                      <p className="text-[10px] text-m3-secondary font-mono mt-0.5">
                        {t("settings.account.activeSessions.ip", {
                          ip: sess.ipAddress || t("settings.account.activeSessions.currentIp"),
                          date: new Date(sess.createdAt).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(sess.token)}
                    className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 cursor-pointer shrink-0"
                  >
                    {t("settings.account.activeSessions.terminate")}
                  </button>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-4 text-center">
          {t("settings.account.activeSessions.currentSessionOnly")}
        </p>
      )}
    </div>
  );
};

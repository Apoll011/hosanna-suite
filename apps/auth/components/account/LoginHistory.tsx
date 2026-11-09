"use client";

import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale";
import { parseUserAgent, type DeviceType } from "@/lib/parse-user-agent";
import {
  Globe,
  History,
  LogIn,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const LOGIN_EVENT_TYPES = new Set([
  "user_signed_in",
  "user_signed_out",
  "session_created",
  "session_revoked",
  "sessions_revoked_all",
]);

const DEVICE_ICONS: Record<DeviceType, typeof Globe> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Globe,
};

type AuditEvent = {
  eventKey: string;
  eventType: string;
  createdAt: string;
  eventData?: Record<string, unknown>;
  location?: { ipAddress?: string; city?: string; country?: string };
};

export function LoginHistorySection() {
  const { t, locale } = useLocale();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const fetchLogs = useCallback(
    async (nextOffset = 0, append = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await authClient.getSession({ query: {} });
        const result = await authClient.dash.getAuditLogs({
          session: session.data,
          eventType: "user_signed_in",
          limit,
          offset: nextOffset,
        });
        if (result.error) {
          throw new Error(result.error.message || t("loginHistory.loadError"));
        }
        const raw = (result.data?.events ?? []) as AuditEvent[];
        const filtered = raw.filter((e) => LOGIN_EVENT_TYPES.has(e.eventType));
        setEvents((prev) => (append && prev ? [...prev, ...filtered] : filtered));
        setTotal(result.data?.total ?? filtered.length);
        setOffset(nextOffset);
      } catch (err) {
        setError((err as Error)?.message || t("loginHistory.loadError"));
        if (!append) setEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void fetchLogs(0, false);
  }, [fetchLogs]);

  const formatWhen = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(locale === "pt" ? "pt-PT" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasMore = (events?.length ?? 0) < total && !isLoading;

  return (
    <div className="bg-m3-card border border-m3-border rounded-xl p-6 shadow-xs h-full">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-m3-text flex items-center gap-2">
            <History className="w-4 h-4 text-m3-secondary" />
            {t("loginHistory.title")}
          </h3>
          <p className="text-xs text-m3-secondary mt-0.5">{t("loginHistory.personalDesc")}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchLogs(0, false)}
          disabled={isLoading}
          className="p-1.5 text-m3-secondary hover:text-m3-text rounded-lg hover:bg-m3-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading && events === null ? (
        <div className="py-8 flex items-center justify-center">
          <Spinner size="md" label={t("loginHistory.loading")} />
        </div>
      ) : error ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchLogs(0, false)}>
            {t("common.retry")}
          </Button>
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((log, idx) => {
            const ua =
              (typeof log.eventData?.userAgent === "string" && log.eventData.userAgent) ||
              (typeof log.eventData?.user_agent === "string" && log.eventData.user_agent) ||
              null;
            const info = parseUserAgent(ua);
            const DeviceIcon = DEVICE_ICONS[info.deviceType];
            const ip =
              log.location?.ipAddress ||
              (typeof log.eventData?.ipAddress === "string" ? log.eventData.ipAddress : null);
            const isSignOut =
              log.eventType === "user_signed_out" ||
              log.eventType === "session_revoked" ||
              log.eventType === "sessions_revoked_all";
            const EventIcon = isSignOut ? LogOut : LogIn;
            const labelKey =
              log.eventType === "user_signed_in"
                ? "loginHistory.events.signedIn"
                : log.eventType === "user_signed_out"
                  ? "loginHistory.events.signedOut"
                  : log.eventType === "session_created"
                    ? "loginHistory.events.sessionCreated"
                    : log.eventType === "session_revoked"
                      ? "loginHistory.events.sessionRevoked"
                      : log.eventType === "sessions_revoked_all"
                        ? "loginHistory.events.sessionsRevokedAll"
                        : "loginHistory.events.other";
            const deviceTitle =
              [info.client, info.os, info.device].filter(Boolean).join(" · ") ||
              ua ||
              t("settings.account.activeSessions.browserSession");
            const locationParts = [log.location?.city, log.location?.country].filter(Boolean);

            return (
              <div
                key={`${log.eventKey}-${log.createdAt}-${idx}`}
                className="p-3 bg-m3-sidebar rounded-xl border border-m3-border flex items-start gap-3"
              >
                <div className="p-2 bg-m3-card rounded-lg border border-m3-border shrink-0">
                  <DeviceIcon className="w-4 h-4 text-m3-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-m3-text">
                      <EventIcon className="w-3 h-3 text-m3-secondary" />
                      {t(labelKey)}
                    </span>
                    <span className="text-[10px] text-m3-secondary tabular-nums">
                      {formatWhen(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-m3-secondary mt-0.5 truncate" title={ua ?? undefined}>
                    {deviceTitle}
                  </p>
                  <p className="text-[10px] text-m3-secondary font-mono mt-0.5">
                    {t("loginHistory.meta", {
                      ip: ip || t("settings.account.activeSessions.currentIp"),
                      location:
                        locationParts.length > 0
                          ? locationParts.join(", ")
                          : t("loginHistory.unknownLocation"),
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isLoading}
                onClick={() => void fetchLogs(offset + limit, true)}
              >
                {t("loginHistory.loadMore")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-6 text-center">{t("loginHistory.empty")}</p>
      )}
    </div>
  );
}

"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { parseUserAgent, type DeviceType } from "@/lib/parse-user-agent";
import { Button, PageHeader, Spinner, Surface, useAnyRole } from "@hosanna/ui";
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

type OrgMemberRef = { userId: string; name: string; email: string };

function readString(data: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Sign-in events are user-scoped. Owners/admins query each member via userId
 * (same approach as Studio LoginHistorySection).
 */
async function fetchOrganizationLoginEvents(
  members: OrgMemberRef[],
): Promise<{ events: AuditEvent[]; error: string | null }> {
  if (members.length === 0) return { events: [], error: null };

  const settled = await Promise.all(
    members.map(async (member) => {
      const result = await authClient.dash.getAllAuditLogs({
        userId: member.userId,
        eventType: "user_signed_in",
        limit: 50,
        offset: 0,
      });
      if (result.error) {
        return { events: [] as AuditEvent[], error: result.error.message || null };
      }
      const events = ((result.data?.events ?? []) as AuditEvent[])
        .filter((e) => LOGIN_EVENT_TYPES.has(e.eventType))
        .map((e) => ({
          ...e,
          eventData: {
            ...e.eventData,
            userId: member.userId,
            name: member.name || readString(e.eventData, "name"),
            email: member.email || readString(e.eventData, "email", "identifier"),
          },
        }));
      return { events, error: null as string | null };
    }),
  );

  const errors = settled.map((s) => s.error).filter(Boolean);
  const events = settled
    .flatMap((s) => s.events)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (events.length === 0 && errors.length === members.length) {
    return { events: [], error: errors[0] };
  }
  return { events, error: null };
}

export function OrgActivityPage() {
  const { t, locale } = useI18n();
  const { organization, isLoading: orgLoading } = useActiveOrganization();
  const { matched: canViewLoginActivity } = useAnyRole("owner", "admin");
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!organization?.members) return;
    setIsLoading(true);
    setError(null);
    try {
      const members: OrgMemberRef[] = [];
      for (const m of organization.members) {
        if (!m.userId) continue;
        members.push({
          userId: m.userId,
          name: m.user?.name || "",
          email: m.user?.email || "",
        });
      }
      const { events: orgEvents, error: orgError } = await fetchOrganizationLoginEvents(members);
      if (orgError) throw new Error(orgError || t("loginHistory.loadError"));
      setEvents(orgEvents);
    } catch (err) {
      setError((err as Error)?.message || t("loginHistory.loadError"));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.members, t]);

  useEffect(() => {
    if (orgLoading || !organization?.id) return;
    if (!canViewLoginActivity) return;
    void fetchLogs();
  }, [orgLoading, organization?.id, canViewLoginActivity, fetchLogs]);

  const formatWhen = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (orgLoading) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!organization) {
    return (
      <AccountCenter>
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.noOrganization")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  if (!canViewLoginActivity) {
    return (
      <AccountCenter>
        <div className="space-y-6">
          <PageHeader
            title={t("organization.loginActivity.title")}
            description={t("organization.loginActivity.desc")}
          />
          <Surface className="text-center py-8">
            <h3 className="text-base font-semibold text-m3-text">
              {t("organization.loginActivity.noAccessTitle")}
            </h3>
            <p className="text-sm text-m3-secondary mt-1">
              {t("organization.loginActivity.noAccessDesc")}
            </p>
          </Surface>
        </div>
      </AccountCenter>
    );
  }

  return (
    <AccountCenter>
      <div className="space-y-6">
      <PageHeader
        title={t("organization.loginActivity.title")}
        description={t("organization.loginActivity.desc")}
      />

      <Surface>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h3 className="text-title text-m3-text flex items-center gap-2">
              <History className="w-4 h-4 text-m3-primary" />
              {t("organization.loginActivity.listTitle")}
            </h3>
            <p className="text-muted mt-0.5">{t("loginHistory.orgDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={isLoading}
            className="p-1.5 text-m3-secondary hover:text-m3-text rounded-lg hover:bg-m3-hover cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading && events === null ? (
          <div className="py-8 flex justify-center">
            <Spinner size="md" label={t("loginHistory.loading")} />
          </div>
        ) : error ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchLogs()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((log, idx) => {
              const ua =
                readString(log.eventData, "userAgent", "user_agent", "ua") || null;
              const info = parseUserAgent(ua);
              const DeviceIcon = DEVICE_ICONS[info.deviceType];
              const actorName = readString(log.eventData, "name", "userName");
              const actorEmail = readString(log.eventData, "email", "identifier");
              const ip =
                log.location?.ipAddress ||
                readString(log.eventData, "ipAddress", "ip_address", "ip");
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
                    {(actorName || actorEmail) && (
                      <p className="text-xs font-semibold text-m3-text mt-1 truncate">
                        {actorName || actorEmail}
                        {actorName && actorEmail ? (
                          <span className="font-normal text-m3-secondary"> · {actorEmail}</span>
                        ) : null}
                      </p>
                    )}
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
          </div>
        ) : (
          <p className="text-xs text-m3-secondary py-6 text-center">{t("loginHistory.empty")}</p>
        )}
      </Surface>
      </div>
    </AccountCenter>
  );
}

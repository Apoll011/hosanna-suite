/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner } from "@/src/components/common";
import { useAuth } from "@/src/contexts/AuthContext";
import { authClient } from "@/src/lib/authClient";
import { useI18n, type TranslationKey } from "@/src/lib/i18n";
import { DeviceType, parseUserAgent } from "@/src/lib/parseUserAgent";
import type { DashAuditLog } from "@better-auth/infra/client";
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
import React, { useCallback, useEffect, useState } from "react";

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

const EVENT_LABEL_KEYS: Record<string, TranslationKey> = {
  user_signed_in: "loginHistory.events.signedIn",
  user_signed_out: "loginHistory.events.signedOut",
  session_created: "loginHistory.events.sessionCreated",
  session_revoked: "loginHistory.events.sessionRevoked",
  sessions_revoked_all: "loginHistory.events.sessionsRevokedAll",
};

export type LoginHistoryScope = "self" | "organization";

export interface LoginHistorySectionProps {
  scope: LoginHistoryScope;
  /** When false, skip fetching (e.g. inactive tab). Defaults to true. */
  active?: boolean;
  /** Optional override for section chrome (title/desc). */
  titleKey?: TranslationKey;
  descKey?: TranslationKey;
  /** Hide the card title/description (keep refresh). */
  hideHeader?: boolean;
}

type OrgMemberRef = {
  userId: string;
  name: string;
  email: string;
};

function readString(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
): string | null {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function eventActor(log: DashAuditLog): {
  name: string | null;
  email: string | null;
  userId: string | null;
} {
  const data = log.eventData ?? {};
  return {
    name: readString(data, "name", "userName", "user_name"),
    email: readString(data, "email", "identifier", "userEmail"),
    userId: readString(data, "userId", "user_id"),
  };
}

function eventUserAgent(log: DashAuditLog): string | null {
  return readString(log.eventData, "userAgent", "user_agent", "ua");
}

function eventIp(log: DashAuditLog): string | null {
  return (
    log.location?.ipAddress ||
    readString(log.eventData, "ipAddress", "ip_address", "ip")
  );
}

function sortByNewest(a: DashAuditLog, b: DashAuditLog): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function enrichEvent(log: DashAuditLog, member?: OrgMemberRef): DashAuditLog {
  if (!member) return log;
  return {
    ...log,
    eventData: {
      ...log.eventData,
      userId: member.userId,
      name: member.name || readString(log.eventData, "name"),
      email: member.email || readString(log.eventData, "email", "identifier"),
    },
  };
}

function listOrgMembers(
  organization: ReturnType<typeof useAuth>["organization"],
): OrgMemberRef[] {
  const members = organization?.members ?? [];
  const out: OrgMemberRef[] = [];
  for (const m of members) {
    const userId = m.userId || m.user?.id;
    if (!userId) continue;
    out.push({
      userId,
      name: m.user?.name || "",
      email: m.user?.email || "",
    });
  }
  return out;
}

/**
 * Workspace login activity: sign-in events are user-scoped (not org-scoped),
 * so `getAllAuditLogs({ organizationId })` often returns nothing for
 * `user_signed_in`. Owners/admins can query each member via `userId` instead.
 */
async function fetchOrganizationLoginEvents(
  members: OrgMemberRef[],
  limitPerMember: number,
): Promise<{ events: DashAuditLog[]; error: string | null }> {
  if (members.length === 0) {
    return { events: [], error: null };
  }

  const settled = await Promise.all(
    members.map(async (member) => {
      const result = await authClient.dash.getAllAuditLogs({
        userId: member.userId,
        eventType: "user_signed_in",
        limit: limitPerMember,
        offset: 0,
      });
      if (result.error) {
        return {
          events: [] as DashAuditLog[],
          error: result.error.message || null,
        };
      }
      const events = (result.data?.events ?? [])
        .filter((e) => LOGIN_EVENT_TYPES.has(e.eventType))
        .map((e) => enrichEvent(e, member));
      return { events, error: null as string | null };
    }),
  );

  const errors = settled.map((s) => s.error).filter(Boolean);
  const events = settled.flatMap((s) => s.events).sort(sortByNewest);

  // If every member request failed, surface the first error.
  if (events.length === 0 && errors.length === members.length) {
    return { events: [], error: errors[0] };
  }

  return { events, error: null };
}

export const LoginHistorySection: React.FC<LoginHistorySectionProps> = ({
  scope,
  active = true,
  titleKey,
  descKey,
  hideHeader = false,
}) => {
  const { t, locale } = useI18n();
  const { organization } = useAuth();
  const [events, setEvents] = useState<DashAuditLog[] | null>(null);
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
        if (scope === "organization") {
          const members = listOrgMembers(organization);
          const { events: orgEvents, error: orgError } =
            await fetchOrganizationLoginEvents(members, 50);
          if (orgError) {
            throw new Error(orgError || t("loginHistory.loadError"));
          }
          setEvents(orgEvents);
          setTotal(orgEvents.length);
          setOffset(0);
          return;
        }

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

        const raw = result.data?.events ?? [];
        const filtered = raw.filter((e) => LOGIN_EVENT_TYPES.has(e.eventType));
        setEvents((prev) =>
          append && prev ? [...prev, ...filtered] : filtered,
        );
        setTotal(result.data?.total ?? filtered.length);
        setOffset(nextOffset);
      } catch (err) {
        setError((err as Error)?.message || t("loginHistory.loadError"));
        if (!append) setEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [organization, scope, t],
  );

  useEffect(() => {
    if (!active) return;
    if (scope === "organization" && !organization?.id) return;
    void fetchLogs(0, false);
  }, [active, scope, organization?.id, organization?.members, fetchLogs]);

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

  const resolvedTitle = t(titleKey ?? "loginHistory.title");
  const resolvedDesc = t(
    descKey ??
      (scope === "organization"
        ? "loginHistory.orgDesc"
        : "loginHistory.personalDesc"),
  );

  const hasMore =
    scope === "self" && (events?.length ?? 0) < total && !isLoading;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 gap-3">
        {!hideHeader ? (
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              {resolvedTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {resolvedDesc}
            </p>
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={() => void fetchLogs(0, false)}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title={t("common.refresh")}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchLogs(0, false)}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((log, idx) => {
            const ua = eventUserAgent(log);
            const info = parseUserAgent(ua);
            const DeviceIcon = DEVICE_ICONS[info.deviceType];
            const actor = eventActor(log);
            const ip = eventIp(log);
            const isSignOut =
              log.eventType === "user_signed_out" ||
              log.eventType === "session_revoked" ||
              log.eventType === "sessions_revoked_all";
            const EventIcon = isSignOut ? LogOut : LogIn;
            const labelKey =
              EVENT_LABEL_KEYS[log.eventType] ?? "loginHistory.events.other";
            const clientLabel = info.isApp
              ? t("settings.account.activeSessions.nativeApp", {
                  name: info.client ?? "",
                })
              : info.client;
            const deviceTitle = [clientLabel, info.os, info.device]
              .filter((part): part is string => Boolean(part))
              .join(" · ");
            const locationParts = [
              log.location?.city,
              log.location?.country,
            ].filter(Boolean);

            return (
              <div
                key={`${log.eventKey}-${log.createdAt}-${idx}`}
                className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-3"
              >
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  <DeviceIcon className="w-4 h-4 text-m3-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-100">
                      <EventIcon className="w-3 h-3 text-slate-400" />
                      {t(labelKey)}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {formatWhen(log.createdAt)}
                    </span>
                  </div>
                  {scope === "organization" && (actor.name || actor.email) && (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate">
                      {actor.name || actor.email}
                      {actor.name && actor.email ? (
                        <span className="font-normal text-slate-500">
                          {" "}
                          · {actor.email}
                        </span>
                      ) : null}
                    </p>
                  )}
                  <p
                    className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate"
                    title={ua ?? undefined}
                  >
                    {deviceTitle ||
                      ua ||
                      t("settings.account.activeSessions.browserSession")}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
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
        <p className="text-xs text-slate-500 py-6 text-center">
          {t("loginHistory.empty")}
        </p>
      )}
    </div>
  );
};

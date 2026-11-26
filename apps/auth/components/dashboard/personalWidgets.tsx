"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authClient } from "@/lib/auth/client";
import { useI18n } from "@/lib/ui/i18n";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { Badge } from "@hosanna/ui";
import { Bell, Check, ShieldCheck, ShieldOff, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  SkeletonLine,
  WidgetEmptyBox,
  WidgetErrorBox,
  WidgetHeader,
  WidgetHeaderLink,
} from "./shared";

export function ProfileSecurityWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { user, isLoading } = useAuthUser({ requireAuth: false });
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void authClient
      .listSessions({ query: {} })
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          setSessionCount(res.data.length);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      active = false;
    };
  }, []);

  const twoFactorEnabled = Boolean(
    user && "twoFactorEnabled" in user && (user as { twoFactorEnabled?: boolean }).twoFactorEnabled,
  );
  const emailVerified = Boolean(
    user && "emailVerified" in user && (user as { emailVerified?: boolean }).emailVerified,
  );

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.profileSecurity.title")}
        action={<WidgetHeaderLink href="/account" label={t("home.widgets.profileSecurity.manage")} />}
      />
      {isLoading && !user ? (
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-3 w-44" />
          </div>
        </div>
      ) : !user ? (
        <WidgetEmptyBox
          icon={<User className="h-5 w-5" />}
          title={t("home.widgets.error")}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full border border-m3-border object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-m3-border bg-m3-sidebar text-sm font-semibold text-m3-text">
                {(user.name || user.email || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-m3-text">{user.name}</p>
              <p className="truncate text-caption">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={emailVerified ? "success" : "warning"} size="sm">
              {emailVerified
                ? t("home.widgets.profileSecurity.verified")
                : t("home.widgets.profileSecurity.unverified")}
            </Badge>
            <Badge variant={twoFactorEnabled ? "success" : "neutral"} size="sm">
              {twoFactorEnabled ? (
                <ShieldCheck className="mr-1 h-3 w-3" aria-hidden />
              ) : (
                <ShieldOff className="mr-1 h-3 w-3" aria-hidden />
              )}
              {twoFactorEnabled
                ? t("home.widgets.profileSecurity.twoFactorOn")
                : t("home.widgets.profileSecurity.twoFactorOff")}
            </Badge>
            {sessionCount !== null ? (
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {t("home.widgets.profileSecurity.sessionsCount", { count: sessionCount })}
              </Badge>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

type InboxItem = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | Date | null;
  createdAt?: string | Date;
};

export function InboxWidget(_: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const { organization } = useActiveOrganization();
  const orgId = organization?.id ?? undefined;
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const client = authClient as unknown as {
        inbox?: {
          list?: (args: {
            query: { organizationId?: string; limit: number; offset: number };
          }) => Promise<{ data?: { notifications?: InboxItem[] } | null }>;
          unreadCount?: (args: {
            query: { organizationId?: string };
          }) => Promise<{ data?: { count?: number } | null }>;
          markRead?: (args: { id: string }) => Promise<unknown>;
        };
      };
      if (!client.inbox?.list) {
        setItems([]);
        setUnreadCount(0);
        return;
      }
      const [listRes, countRes] = await Promise.all([
        client.inbox.list({ query: { organizationId: orgId, limit: 5, offset: 0 } }),
        client.inbox.unreadCount
          ? client.inbox.unreadCount({ query: { organizationId: orgId } })
          : Promise.resolve({ data: { count: 0 } }),
      ]);
      setItems(listRes.data?.notifications ?? []);
      setUnreadCount(countRes.data?.count ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const markRead = async (id: string) => {
    const client = authClient as unknown as {
      inbox?: { markRead?: (args: { id: string }) => Promise<unknown> };
    };
    if (!client.inbox?.markRead) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await client.inbox.markRead({ id }).catch(() => {
      void loadInbox();
    });
  };

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.inbox.title")}
        action={
          unreadCount > 0 ? (
            <Badge variant="accent" size="sm" className="tabular-nums">
              {t("home.widgets.inbox.unreadCount", { count: unreadCount })}
            </Badge>
          ) : (
            <WidgetHeaderLink
              href="/account/organization/notifications"
              label={t("home.widgets.inbox.settings")}
            />
          )
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : items.length === 0 ? (
        <WidgetEmptyBox
          icon={<Bell className="h-5 w-5" />}
          title={t("home.widgets.inbox.empty")}
          description={t("home.widgets.inbox.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <li key={item.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {unread ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-m3-primary" aria-hidden />
                    ) : null}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="truncate text-sm font-medium text-m3-text hover:text-m3-primary hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <p className="truncate text-sm font-medium text-m3-text">{item.title}</p>
                    )}
                  </div>
                  {item.body ? <p className="line-clamp-1 text-caption">{item.body}</p> : null}
                  {item.createdAt ? (
                    <p className="text-[11px] text-m3-secondary tabular-nums">
                      {new Date(item.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
                {unread ? (
                  <button
                    type="button"
                    onClick={() => void markRead(item.id)}
                    aria-label={t("home.widgets.inbox.markRead")}
                    title={t("home.widgets.inbox.markRead")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-primary"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

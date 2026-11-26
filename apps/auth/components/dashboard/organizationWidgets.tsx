"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth/client";
import { ensureActiveOrganizationSession } from "@/lib/services/api";
import { useI18n } from "@/lib/ui/i18n";
import { resolveEffectivePermissions } from "@hosanna/auth";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { Badge } from "@hosanna/ui";
import {
  Building2,
  CalendarRange,
  ChevronRight,
  CreditCard,
  HardDrive,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getOrgCache,
  setOrgCache,
  SkeletonLine,
  useOrganizationData,
  useOrganizationLoader,
  useReplicationCollection,
  WidgetEmptyBox,
  WidgetErrorBox,
  WidgetHeader,
  WidgetHeaderLink,
  type FolderRow,
  type SongsResponse,
} from "./shared";

type SubscriptionRow = {
  id: string;
  plan: string;
  status: string;
  periodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean | null;
  trialEnd?: string | Date | null;
  billingInterval?: string | null;
};

type SubscriptionWidgetState = {
  entitled: boolean;
  subscription: SubscriptionRow | null;
};

export function SubscriptionWidget(_: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const { organization } = useActiveOrganization();
  const [state, setState] = useState<{
    organizationId: string | null;
    value: SubscriptionWidgetState | null;
    loading: boolean;
    error: boolean;
  }>({ organizationId: null, value: null, loading: true, error: false });

  useEffect(() => {
    let active = true;
    const orgId = organization?.id;
    if (!orgId) {
      setState({ organizationId: null, value: null, loading: false, error: false });
      return;
    }
    const cached = getOrgCache<SubscriptionWidgetState>(orgId, "subscription-details");
    if (cached !== undefined) {
      setState({ organizationId: orgId, value: cached, loading: false, error: false });
      return;
    }
    setState({ organizationId: orgId, value: null, loading: true, error: false });
    void ensureActiveOrganizationSession(orgId)
      .then(async () => {
        const [entitledRes, listRes] = await Promise.all([
          fetch("/api/billing/entitlement", { credentials: "include" }).then(async (res) => {
            if (!res.ok) throw new Error("Request failed");
            return (await res.json()) as { entitled: boolean };
          }),
          authClient.subscription
            .list({ query: { referenceId: orgId, customerType: "organization" } })
            .catch(() => ({ data: null })),
        ]);
        const rows = Array.isArray(listRes.data) ? (listRes.data as SubscriptionRow[]) : [];
        const activeSub =
          rows.find((row) => row.status === "active" || row.status === "trialing") ??
          rows[0] ??
          null;
        return { entitled: entitledRes.entitled, subscription: activeSub };
      })
      .then((value) => {
        setOrgCache(orgId, "subscription-details", value);
        if (active) setState({ organizationId: orgId, value, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState({ organizationId: orgId, value: null, loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [organization?.id]);

  const currentState =
    state.organizationId === (organization?.id ?? null)
      ? state
      : { organizationId: organization?.id ?? null, value: null, loading: true, error: false };
  const { value, loading, error } = currentState;
  const sub = value?.subscription;
  const isTrialing = sub?.status === "trialing";
  const isCanceling = Boolean(sub?.cancelAtPeriodEnd);
  const targetDate = isTrialing ? sub?.trialEnd : sub?.periodEnd;
  const daysLeft = targetDate
    ? Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000))
    : null;
  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.subscription.title")}
        action={
          !loading && !error && value ? (
            <Badge
              variant={
                isCanceling
                  ? "warning"
                  : isTrialing
                    ? "accent"
                    : value.entitled
                      ? "success"
                      : "neutral"
              }
              size="sm"
            >
              {isCanceling
                ? t("home.widgets.subscription.canceling")
                : isTrialing
                  ? t("home.widgets.subscription.trialing")
                  : value.entitled
                    ? t("home.widgets.subscription.active")
                    : t("home.widgets.subscription.inactive")}
            </Badge>
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-8 w-28 rounded-md" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : value?.entitled ? (
        <div className="space-y-3">
          <div className="surface-inset flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-m3-text">
                <Sparkles className="h-3.5 w-3.5 text-m3-primary" aria-hidden />
                {t("home.widgets.subscription.planName")}
              </p>
              <p className="text-caption">
                {sub?.billingInterval === "year"
                  ? t("home.widgets.subscription.annual")
                  : sub?.billingInterval
                    ? t("home.widgets.subscription.monthly")
                    : null}
                {daysLeft !== null
                  ? `${sub?.billingInterval ? " · " : ""}${
                      isTrialing || isCanceling
                        ? t("home.widgets.subscription.endsIn", { count: daysLeft })
                        : t("home.widgets.subscription.renewsIn", { count: daysLeft })
                    }`
                  : null}
              </p>
            </div>
            {formattedDate ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-caption tabular-nums">
                <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                {formattedDate}
              </span>
            ) : null}
          </div>
          <Link
            href="/account/organization/billing"
            className="inline-flex items-center gap-1 text-xs font-medium text-m3-primary hover:underline"
          >
            {t("home.widgets.subscription.manage")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <WidgetEmptyBox
          icon={<CreditCard className="h-5 w-5" />}
          title={t("home.widgets.subscription.inactive")}
          description={t("home.widgets.subscription.inactiveHint")}
          action={
            <Link
              href="/account/organization/billing"
              className="inline-flex items-center gap-1.5 rounded-md bg-m3-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-m3-primary-dark"
            >
              {t("home.widgets.subscription.manage")}
            </Link>
          }
        />
      )}
    </>
  );
}

export function OrganizationOverviewWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { organization, activeRole, capabilities } = useActiveOrganization();

  if (!organization) {
    return (
      <WidgetEmptyBox
        icon={<Building2 className="h-5 w-5" />}
        title={t("home.widgets.error")}
      />
    );
  }

  const initials = organization.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const memberCount = organization.members?.length ?? 0;

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.orgOverview.title")}
        action={
          activeRole ? (
            <Badge variant="neutral" size="sm">
              {activeRole}
            </Badge>
          ) : null
        }
      />
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {organization.logo ? (
            <img
              src={organization.logo}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl border border-m3-border object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-m3-border bg-m3-sidebar text-sm font-semibold text-m3-text">
              {initials || <Building2 className="h-5 w-5 text-m3-secondary" aria-hidden />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-m3-text">{organization.name}</p>
            <p className="truncate text-caption tabular-nums">
              @{organization.slug} · {t("home.widgets.orgOverview.members", { count: memberCount })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/account/organization/profile"
            className="rounded-md border border-m3-border bg-m3-card px-2.5 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
          >
            {t("home.widgets.orgOverview.profileLink")}
          </Link>
          <Link
            href="/account/organization/members"
            className="rounded-md border border-m3-border bg-m3-card px-2.5 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
          >
            {t("home.widgets.orgOverview.membersLink")}
          </Link>
          {capabilities.canManageOrg ? (
            <Link
              href="/account/organization/regional"
              className="rounded-md border border-m3-border bg-m3-card px-2.5 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
            >
              {t("home.widgets.orgOverview.regionalLink")}
            </Link>
          ) : null}
          {capabilities.canExportBackup ? (
            <Link
              href="/account/organization/data"
              className="rounded-md border border-m3-border bg-m3-card px-2.5 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
            >
              {t("home.widgets.orgOverview.dataLink")}
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

type TeamRow = {
  id: string;
  name: string;
  memberCount: number;
  members: Array<{
    id: string;
    userId: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }>;
};

export function TeamsWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const loadTeams = useCallback(async (orgId: string) => {
    await ensureActiveOrganizationSession(orgId);
    const res = await fetch("/api/organization/teams", { credentials: "include" });
    if (!res.ok) throw new Error("Request failed");
    return (await res.json()) as { teams: TeamRow[] };
  }, []);
  const { value, loading, error } = useOrganizationLoader("org-teams", loadTeams);
  const teams = (value?.teams ?? []).slice(0, 5);

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.teams.title")}
        action={
          <WidgetHeaderLink
            href="/account/organization/teams"
            label={t("home.widgets.teams.open")}
          />
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : teams.length === 0 ? (
        <WidgetEmptyBox
          icon={<Users className="h-5 w-5" />}
          title={t("home.widgets.teams.empty")}
          description={t("home.widgets.teams.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center justify-between gap-2.5 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-m3-text">{team.name}</p>
                <p className="text-caption tabular-nums">
                  {t("home.widgets.teams.membersCount", { count: team.memberCount })}
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {team.members.slice(0, 3).map((member) =>
                  member.image ? (
                    <img
                      key={member.id}
                      src={member.image}
                      alt=""
                      className="h-6 w-6 rounded-full border border-m3-card object-cover"
                    />
                  ) : (
                    <span
                      key={member.id}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-m3-card bg-m3-sidebar text-[10px] font-semibold text-m3-text"
                    >
                      {(member.name || member.email || "?")[0]?.toUpperCase()}
                    </span>
                  ),
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function MembersWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { organization, capabilities } = useActiveOrganization();
  const loadInvites = useCallback(
    async (orgId: string) => {
      if (!capabilities.canManageInvites) return [] as Array<{ id: string; status: string }>;
      const { data } = await authClient.organization.listInvitations({
        query: { organizationId: orgId },
      });
      return Array.isArray(data)
        ? (data as Array<{ id: string; status: string }>).filter((inv) => inv.status === "pending")
        : [];
    },
    [capabilities.canManageInvites],
  );
  const { value: pendingInvites } = useOrganizationLoader(
    `org-pending-invites-${capabilities.canManageInvites}`,
    loadInvites,
    Boolean(organization?.id),
  );

  const members = useMemo(() => organization?.members ?? [], [organization?.members]);
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      const role = m.role || "member";
      counts.set(role, (counts.get(role) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [members]);

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.members.title")}
        action={
          <WidgetHeaderLink
            href="/account/organization/members"
            label={t("home.widgets.members.open")}
          />
        }
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-m3-secondary" aria-hidden />
            <span className="text-sm font-semibold tabular-nums text-m3-text">
              {t("home.widgets.members.total", { count: members.length })}
            </span>
          </div>
          {capabilities.canManageInvites ? (
            <Badge
              variant={(pendingInvites?.length ?? 0) > 0 ? "accent" : "neutral"}
              size="sm"
              className="tabular-nums"
            >
              {(pendingInvites?.length ?? 0) > 0
                ? t("home.widgets.members.pendingInvites", { count: pendingInvites?.length ?? 0 })
                : t("home.widgets.members.noPending")}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {roleCounts.map(([role, count]) => (
            <Badge key={role} variant="neutral" size="sm" className="tabular-nums">
              {role} · {count}
            </Badge>
          ))}
        </div>

        {members.length > 0 ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex -space-x-2">
              {members.slice(0, 6).map((member) =>
                member.user?.image ? (
                  <img
                    key={member.id}
                    src={member.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-m3-card object-cover"
                  />
                ) : (
                  <span
                    key={member.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-m3-card bg-m3-sidebar text-[11px] font-semibold text-m3-text"
                  >
                    {(member.user?.name || member.user?.email || "?")[0]?.toUpperCase()}
                  </span>
                ),
              )}
            </div>
            {members.length > 6 ? (
              <span className="text-caption tabular-nums">+{members.length - 6}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

export function WorkspaceUsageWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { organization, activeRole, capabilities } = useActiveOrganization();
  const perms = useMemo(
    () => new Set(resolveEffectivePermissions({ orgRole: activeRole }).allowed),
    [activeRole],
  );
  const canSongs = perms.has("song.access");
  const canFolders = perms.has("folder.access");
  const canServices = perms.has("service.access");
  const canCollections = perms.has("collection.access");
  const canAgenda = perms.has("agenda.access");

  const songs = useOrganizationData<SongsResponse>("songs-summary", "/songs?limit=150", canSongs);
  const folders = useOrganizationData<FolderRow[]>("folders-summary", "/folders", canFolders);
  const services = useOrganizationData<unknown[]>(
    "services",
    "/services?metadataOnly=true",
    canServices,
  );
  const collections = useReplicationCollection<{ id: string; isDeleted?: boolean; _deleted?: boolean }>(
    "collections",
    100,
    canCollections,
  );
  const agenda = useReplicationCollection<{ id: string; isDeleted?: boolean; _deleted?: boolean }>(
    "agendaEvents",
    100,
    canAgenda,
  );

  const loading =
    (canSongs && songs.loading) ||
    (canFolders && folders.loading) ||
    (canServices && services.loading);

  const items = [
    canSongs && {
      key: "songs",
      label: t("home.widgets.workspaceUsage.songs"),
      value: songs.value?.total ?? 0,
    },
    canFolders && {
      key: "folders",
      label: t("home.widgets.workspaceUsage.folders"),
      value: folders.value?.length ?? 0,
    },
    canCollections && {
      key: "collections",
      label: t("home.widgets.workspaceUsage.collections"),
      value: collections.value?.length ?? 0,
    },
    canServices && {
      key: "services",
      label: t("home.widgets.workspaceUsage.services"),
      value: services.value?.length ?? 0,
    },
    canAgenda && {
      key: "agenda",
      label: t("home.widgets.workspaceUsage.agenda"),
      value: agenda.value?.length ?? 0,
    },
    {
      key: "members",
      label: t("home.widgets.workspaceUsage.members"),
      value: organization?.members?.length ?? 0,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; value: number }>;

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.workspaceUsage.title")}
        action={
          capabilities.canExportBackup ? (
            <WidgetHeaderLink
              href="/account/organization/data"
              label={t("home.widgets.workspaceUsage.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <SkeletonLine key={item} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <WidgetEmptyBox
          icon={<HardDrive className="h-5 w-5" />}
          title={t("home.widgets.error")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.key} className="surface-inset px-3 py-2">
              <p className="text-caption truncate">{item.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-m3-text">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { authClient } from "@/lib/auth-client";
import {
  clearCachedOrg,
  readCachedActiveOrg,
  readCachedOrgList,
  writeCachedActiveOrg,
  writeCachedOrgList,
} from "@/lib/org-cache";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type OrgMember = {
  id: string;
  userId: string;
  role: string;
  createdAt?: string | Date;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export type ActiveOrganization = OrgSummary & {
  metadata?: unknown;
  members?: OrgMember[];
};

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function normalizeMember(m: OrgMember & { name?: string; email?: string; image?: string }): OrgMember {
  return {
    id: m.id,
    userId: m.userId || m.user?.id || m.id,
    role: m.role || "member",
    createdAt: m.createdAt,
    user: {
      id: m.user?.id || m.userId,
      name: m.user?.name ?? m.name ?? null,
      email: m.user?.email ?? m.email ?? null,
      image: m.user?.image ?? m.image ?? null,
    },
  };
}

function normalizeOrg(raw: ActiveOrganization): ActiveOrganization {
  return {
    ...raw,
    metadata: parseMetadata(raw.metadata),
    members: (raw.members ?? []).map((m) =>
      normalizeMember(m as OrgMember & { name?: string; email?: string; image?: string }),
    ),
  };
}

export type OrgCapabilities = {
  canManageOrg: boolean;
  canManageInvites: boolean;
  isOwner: boolean;
  canManageBilling: boolean;
  canAccessBilling: boolean;
  canExportBackup: boolean;
  canImportBackup: boolean;
  canViewLoginActivity: boolean;
  canManageMembers: boolean;
  canSendNotifications: boolean;
  canManageAi: boolean;
};

function capabilitiesForRole(role: string | null): OrgCapabilities {
  const r = (role || "").toLowerCase();
  const isOwner = r === "owner";
  const isAdmin = r === "admin";
  const isTeamLeader = r === "teamleader" || r === "team_leader" || r === "leader";
  return {
    canManageOrg: isOwner || isAdmin,
    canManageInvites: isOwner || isAdmin || isTeamLeader,
    isOwner,
    canManageBilling: isOwner,
    canAccessBilling: isOwner,
    canExportBackup: isOwner || isAdmin,
    canImportBackup: isOwner,
    canViewLoginActivity: isOwner || isAdmin,
    canManageMembers: isOwner || isAdmin,
    canSendNotifications: isOwner || isAdmin || isTeamLeader,
    canManageAi: isOwner || isAdmin,
  };
}

export type ActiveOrganizationValue = {
  user: ReturnType<typeof useAuthUser>["user"];
  userLoading: boolean;
  organizations: OrgSummary[];
  organization: ActiveOrganization | null;
  metadata: Record<string, unknown>;
  activeMember: OrgMember | null;
  activeRole: string | null;
  capabilities: OrgCapabilities;
  /** True only when there is no cached/live org yet. */
  isLoading: boolean;
  /** Background refresh in flight (cache may already be showing). */
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setActive: (org: OrgSummary) => Promise<void>;
  switchOrganization: (org: OrgSummary) => Promise<boolean>;
};

const ActiveOrganizationContext = createContext<ActiveOrganizationValue | null>(null);

function useActiveOrganizationState(): ActiveOrganizationValue {
  const { user, isLoading: userLoading } = useAuthUser({
    loginRedirect: "/login?redirect=/account",
  });

  const [organizations, setOrganizations] = useState<OrgSummary[]>(
    () => readCachedOrgList() ?? [],
  );
  const [organization, setOrganization] = useState<ActiveOrganization | null>(
    () => readCachedActiveOrg(),
  );
  const [isLoading, setIsLoading] = useState(() => !readCachedActiveOrg());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyOrg = useCallback((org: ActiveOrganization | null) => {
    setOrganization(org);
    writeCachedActiveOrg(org);
    if (org?.slug) localStorage.setItem("active_org_slug", org.slug);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [listRes, fullRes] = await Promise.all([
        authClient.organization.list({}),
        authClient.organization.getFullOrganization({ query: {} }),
      ]);

      const list = ((listRes.data ?? []) as OrgSummary[]) || [];
      setOrganizations(list);
      writeCachedOrgList(list);

      const full = fullRes.data as ActiveOrganization | null | undefined;
      if (full?.id) {
        applyOrg(normalizeOrg(full));
      } else {
        const storedSlug =
          typeof localStorage !== "undefined" ? localStorage.getItem("active_org_slug") : null;
        const fallback =
          (storedSlug ? list.find((o) => o.slug === storedSlug) : undefined) || list[0] || null;
        if (fallback) {
          await authClient.organization.setActive({ organizationSlug: fallback.slug });
          const again = await authClient.organization.getFullOrganization({ query: {} });
          const org = again.data as ActiveOrganization | null | undefined;
          applyOrg(org?.id ? normalizeOrg(org) : null);
        } else {
          applyOrg(null);
        }
      }
    } catch (err) {
      setError((err as Error)?.message || "Failed to load organization");
      // Keep cached org on transient failures.
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyOrg]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setIsLoading(false);
      clearCachedOrg();
      setOrganization(null);
      setOrganizations([]);
      return;
    }
    void refresh();
  }, [user, userLoading, refresh]);

  const setActive = useCallback(
    async (org: OrgSummary) => {
      // Optimistic paint so the switcher + pages update immediately.
      setOrganization((prev) => {
        if (prev?.id === org.id) return prev;
        const optimistic: ActiveOrganization = {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo ?? null,
          metadata: {},
          members: [],
        };
        writeCachedActiveOrg(optimistic);
        return optimistic;
      });
      localStorage.setItem("active_org_slug", org.slug);

      await authClient.organization.setActive({ organizationSlug: org.slug });
      await refresh();
    },
    [refresh],
  );

  const switchOrganization = useCallback(
    async (org: OrgSummary): Promise<boolean> => {
      try {
        await setActive(org);
        return true;
      } catch {
        return false;
      }
    },
    [setActive],
  );

  const activeMember = useMemo(() => {
    if (!organization?.members || !user?.id) return null;
    return organization.members.find((m) => m.userId === user.id) ?? null;
  }, [organization?.members, user?.id]);

  const activeRole = activeMember?.role ?? null;
  const capabilities = useMemo(() => capabilitiesForRole(activeRole), [activeRole]);

  const metadata = useMemo(
    () => parseMetadata(organization?.metadata),
    [organization?.metadata],
  );

  return {
    user,
    userLoading,
    organizations,
    organization,
    metadata,
    activeMember,
    activeRole,
    capabilities,
    isLoading: (userLoading || isLoading) && !organization,
    isRefreshing: isRefreshing || (userLoading && Boolean(organization)),
    error,
    refresh,
    setActive,
    switchOrganization,
  };
}

/** Shared org state for account nav + org pages (one fetch, cached). */
export function ActiveOrganizationProvider({ children }: { children: ReactNode }) {
  const value = useActiveOrganizationState();
  return createElement(ActiveOrganizationContext.Provider, { value }, children);
}

export function useActiveOrganization(): ActiveOrganizationValue {
  const ctx = useContext(ActiveOrganizationContext);
  if (!ctx) {
    throw new Error("useActiveOrganization must be used within ActiveOrganizationProvider");
  }
  return ctx;
}

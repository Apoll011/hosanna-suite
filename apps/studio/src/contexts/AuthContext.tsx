/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponsibilityCategory } from "@/src/types";
import { InvitationStatus } from "better-auth/plugins/organization";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDemoOrganization, getDemoUser } from "../demo/demoAuth";
import { clearDemoData, isDemoMode } from "../demo/index";
import { getPersistedSettingsJson, syncSettingsFromMetadata } from "../hooks/usePersonalSettings";
import { authClient } from "../lib/authClient";
import {
  CACHED_ORG_KEY,
  CACHED_ORGS_KEY,
  CACHED_TRIAL_KEY,
  CACHED_USER_KEY,
  canTrustCachedSessionForPaint,
  readCachedUserId,
} from "../lib/authSessionCache";
import { clearPermissionCache } from "@hosanna/ui";
import { posthog } from "../lib/posthog";
import { fetchSubscriptionRows } from "../lib/subscriptions";
import { ensureOrgScopedData, getDatabase, resetDatabase, resetReplication } from "../db";

export { CACHED_USER_KEY } from "../lib/authSessionCache";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  metadata?: string | null;
  [key: string]: unknown;
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: {
    description?: string;
    shortName?: string;
    settings?: {
      general?: {
        locale?: string;
        timezone?: string;
        weekStartsOn?: number;
      };
      services?: {
        defaultDurations?: {
          sermon?: number;
          song?: number;
        };
        usualStartTime?: string;
        showNotes?: boolean;
        showServiceDuration?: boolean;
        autoSave?: boolean;
      };
      agenda?: {
        responsibilityCategories?: ResponsibilityCategory[];
      };
      appearance?: {
        accentColor?: string;
        showBranding?: boolean;
      };
    };
    [key: string]: unknown;
  } | null;
  members?: {
    id: string;
    organizationId: string;
    role: "admin" | "editor" | "guest" | "member" | "musician" | "owner" | "teamLeader";
    createdAt: Date;
    userId: string;
    teamId?: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }[];
  invitations?: {
    id: string;
    organizationId: string;
    email: string;
    role: "admin" | "editor" | "guest" | "member" | "musician" | "owner" | "teamLeader";
    status: InvitationStatus;
    inviterId: string;
    expiresAt: Date;
    createdAt: Date;
    teamId?: string;
  }[];
};

const normalizeOrganization = (org: unknown): Organization => {
  const organization = org as Organization & { metadata?: unknown };

  if (typeof organization.metadata === "string") {
    try {
      organization.metadata = JSON.parse(organization.metadata) as Record<string, unknown>;
    } catch {
      organization.metadata = null;
    }
  }

  return organization;
};

interface AuthContextType {
  user: SessionUser | null;
  organization: Organization | null;
  /** Every organization the user is a member of (drives the workspace switcher). */
  organizations: Organization[];
  hasAcceptedTrial: boolean | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
  /** Set the active workspace for the session and land on it. */
  switchOrganization: (org: Organization) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DemoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const demoLogout = useCallback(async () => {
    setIsLoading(true);
    localStorage.clear();
    await clearDemoData();
    window.location.assign("/login");
  }, []);
  const demoNoOp = useCallback(async () => {}, []);
  const demoOrg = useMemo(() => getDemoOrganization(), []);
  const demoUser = useMemo(() => getDemoUser(), []);
  const demoDemoValue = useMemo<AuthContextType>(
    () => ({
      user: demoUser,
      organization: demoOrg,
      organizations: [demoOrg],
      hasAcceptedTrial: true,
      isAuthenticated: true,
      isLoading,
      refetch: demoNoOp,
      switchOrganization: demoNoOp as (org: Organization) => Promise<void>,
      logout: demoLogout,
    }),
    [demoUser, demoOrg, isLoading, demoNoOp, demoLogout],
  );
  return <AuthContext.Provider value={demoDemoValue}>{children}</AuthContext.Provider>;
};

const StandardAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stale-While-Revalidate only for positive snapshots (user + org). Cached
  // "no org" / "trial not accepted" must not unlock routing — they redirect to
  // onboarding and race with invite accept / auth-app org switches.
  const [isLoading, setIsLoading] = useState<boolean>(() => !canTrustCachedSessionForPaint());

  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const stored = localStorage.getItem(CACHED_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const stored = localStorage.getItem(CACHED_ORG_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const stored = localStorage.getItem(CACHED_ORGS_KEY);
      return stored ? (JSON.parse(stored) as Organization[]) : [];
    } catch {
      return [];
    }
  });
  const [hasAcceptedTrial, setHasAcceptedTrial] = useState<boolean | null>(() => {
    try {
      const stored = localStorage.getItem(CACHED_TRIAL_KEY);
      return stored === null ? null : stored === "true";
    } catch {
      return null;
    }
  });

  const handleClearSession = useCallback(() => {
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    setHasAcceptedTrial(null);
    localStorage.removeItem("active_org_slug");
    localStorage.removeItem(CACHED_USER_KEY);
    localStorage.removeItem(CACHED_ORG_KEY);
    localStorage.removeItem(CACHED_ORGS_KEY);
    localStorage.removeItem(CACHED_TRIAL_KEY);
    clearPermissionCache();

    setIsLoading(false);
  }, []);

  const fetchSession = useCallback(async () => {
    if (!canTrustCachedSessionForPaint()) {
      setIsLoading(true);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
        const cachedOrgStr = localStorage.getItem(CACHED_ORG_KEY);
        if (cachedUserStr) {
          setUser(JSON.parse(cachedUserStr));
        }
        if (cachedOrgStr) {
          setOrganization(JSON.parse(cachedOrgStr));
        }
        const cachedTrialStr = localStorage.getItem(CACHED_TRIAL_KEY);
        if (cachedTrialStr !== null) {
          setHasAcceptedTrial(cachedTrialStr === "true");
        }
        const cachedOrgsStr = localStorage.getItem(CACHED_ORGS_KEY);
        if (cachedOrgsStr) {
          setOrganizations(JSON.parse(cachedOrgsStr));
        }
      } catch (err) {
        console.error("Failed to restore offline cached session:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const previousCachedUserId = readCachedUserId();
      const { data: sessionData, error: sessionError } = await authClient.getSession({ query: {} });
      const sessionUser = sessionData?.user;

      if (!sessionUser || sessionError) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setIsLoading(false);
          return;
        }
        return handleClearSession();
      }

      // Snapshot prior org cache before any user-switch wipe so external
      // org/user transitions can still remap URL-scoped routes.
      let previousCachedOrgId: string | null = null;
      let previousCachedOrgSlug: string | null = localStorage.getItem("active_org_slug");
      try {
        const cachedOrgStr = localStorage.getItem(CACHED_ORG_KEY);
        if (cachedOrgStr) {
          const cached = JSON.parse(cachedOrgStr) as { id?: string; slug?: string };
          previousCachedOrgId = cached.id ?? null;
          if (!previousCachedOrgSlug && cached.slug) previousCachedOrgSlug = cached.slug;
        }
      } catch {
        // ignore corrupt cache
      }

      const userSwitched = Boolean(previousCachedUserId) && previousCachedUserId !== sessionUser.id;
      if (userSwitched) {
        setOrganization(null);
        setOrganizations([]);
        setHasAcceptedTrial(null);
        localStorage.removeItem(CACHED_ORG_KEY);
        localStorage.removeItem(CACHED_ORGS_KEY);
        localStorage.removeItem(CACHED_TRIAL_KEY);
        localStorage.removeItem("active_org_slug");
        clearPermissionCache();
        try {
          resetReplication();
          resetDatabase();
        } catch (err) {
          console.warn("[AuthContext] Failed to reset local data on user switch:", err);
        }
      }

      let activeOrg: Organization | null = null;
      let userRole: string | undefined = undefined;

      const [initialOrgRes, orgsRes] = await Promise.all([
        authClient.organization.getFullOrganization({ query: {} }),
        authClient.organization.list({ query: {} }),
      ]);

      const orgList = (orgsRes.data ?? []).map((o) => normalizeOrganization(o));
      setOrganizations(orgList);

      if (initialOrgRes.data) {
        activeOrg = normalizeOrganization(initialOrgRes.data);
      } else if (orgList.length > 0) {
        const storedSlug = localStorage.getItem("active_org_slug");
        const targetOrg = orgList.find((o) => o.slug === storedSlug) || orgList[0];

        await authClient.organization.setActive({
          organizationSlug: targetOrg.slug,
        });

        const { data: newlyActiveOrg } = await authClient.organization.getFullOrganization({
          query: {},
        });
        activeOrg = normalizeOrganization(newlyActiveOrg);
      }

      const orgSwitchedExternally = Boolean(
        activeOrg && previousCachedOrgId && previousCachedOrgId !== activeOrg.id,
      );
      const orgScopeNeedsReset = orgSwitchedExternally || (userSwitched && Boolean(activeOrg));

      if (activeOrg) {
        const previousSlug = previousCachedOrgSlug;

        if (previousSlug !== activeOrg.slug || orgScopeNeedsReset) {
          localStorage.setItem("active_org_slug", activeOrg.slug);
          clearPermissionCache();
        }

        if (orgScopeNeedsReset) {
          try {
            resetReplication();
            const db = await getDatabase();
            await ensureOrgScopedData(db, activeOrg.slug);
          } catch (err) {
            console.warn(
              "[AuthContext] Failed to clear local data on external org/user switch:",
              err,
            );
          }
        }

        const currentUserMember = activeOrg.members?.find((m) => m.userId === sessionUser.id);

        if (currentUserMember) {
          userRole = currentUserMember.role;
        } else {
          const { data: roleData } = await authClient.organization.getActiveMemberRole({
            query: {},
          });
          userRole = roleData?.role || undefined;
        }
      } else {
        localStorage.removeItem("active_org_slug");
        clearPermissionCache();
      }

      let acceptedTrial: boolean | null = null;
      if (activeOrg) {
        try {
          const subscriptions = await fetchSubscriptionRows(activeOrg.id);
          acceptedTrial = subscriptions.length > 0;
        } catch {
          // Unknown — fail open so existing users are never locked out of `/`.
          acceptedTrial = true;
        }
      }
      setHasAcceptedTrial(acceptedTrial);

      const fullUser = {
        ...sessionUser,
        role: userRole,
      } as SessionUser;

      // Prefer the local personal-settings snapshot when caching the user so a
      // slow/stale session refetch cannot regress optimistic setting edits.
      const localSettingsJson = getPersistedSettingsJson();
      const userToCache: SessionUser = localSettingsJson
        ? { ...fullUser, metadata: localSettingsJson }
        : fullUser;

      setOrganization(activeOrg);
      setUser(userToCache);
      syncSettingsFromMetadata(fullUser.metadata);

      posthog.identify(fullUser.id, {
        name: fullUser.name,
        email: fullUser.email,
        role: userRole,
        organization_id: activeOrg?.id,
        organization_name: activeOrg?.name,
      });

      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(userToCache));
        if (activeOrg) {
          localStorage.setItem(CACHED_ORG_KEY, JSON.stringify(activeOrg));
        } else {
          localStorage.removeItem(CACHED_ORG_KEY);
        }
        if (orgList.length > 0) {
          localStorage.setItem(CACHED_ORGS_KEY, JSON.stringify(orgList));
        } else {
          localStorage.removeItem(CACHED_ORGS_KEY);
        }
        if (acceptedTrial === null) {
          localStorage.removeItem(CACHED_TRIAL_KEY);
        } else {
          localStorage.setItem(CACHED_TRIAL_KEY, JSON.stringify(acceptedTrial));
        }
      } catch (err) {
        console.warn("Failed to persist session to localStorage:", err);
      }

      // Hard-navigate onto the new slug so URL-scoped routes stay coherent.
      if (orgScopeNeedsReset && activeOrg && typeof window !== "undefined") {
        const path = window.location.pathname;
        const oldPrefix = previousCachedOrgSlug ? `/${previousCachedOrgSlug}` : null;
        let suffix = "/folders";
        if (oldPrefix && (path === oldPrefix || path.startsWith(`${oldPrefix}/`))) {
          const rest = path.slice(oldPrefix.length);
          suffix = rest && rest !== "/" ? rest : "/folders";
        }
        window.location.assign(
          `/${activeOrg.slug}${suffix}${window.location.search}${window.location.hash}`,
        );
        return;
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
      if (cachedUserStr) {
        try {
          setUser(JSON.parse(cachedUserStr));
          const cachedOrgStr = localStorage.getItem(CACHED_ORG_KEY);
          if (cachedOrgStr) {
            setOrganization(JSON.parse(cachedOrgStr));
          }
          const cachedOrgsStr = localStorage.getItem(CACHED_ORGS_KEY);
          if (cachedOrgsStr) {
            setOrganizations(JSON.parse(cachedOrgsStr));
          }
        } catch {
          handleClearSession();
        }
      } else {
        handleClearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleClearSession]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handleOnline = () => {
      fetchSession();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchSession]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "active_org_slug" ||
        e.key === CACHED_USER_KEY ||
        e.key === CACHED_ORG_KEY ||
        e.key === CACHED_ORGS_KEY ||
        e.key === CACHED_TRIAL_KEY
      ) {
        fetchSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSession]);

  // Re-check active org when the user returns from the auth app (or another tab).
  useEffect(() => {
    const refreshIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void fetchSession();
    };
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [fetchSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await authClient.signOut({ fetchOptions: {} });
    posthog.reset();
    handleClearSession();
    localStorage.clear();

    // Reset the IDB singleton *before* deleting the databases.
    // This ensures the next getDatabase() call (e.g. after an in-tab re-login)
    // opens a fresh connection instead of reusing the now-closing one, which
    // would throw "The database connection is closing" on every write/purge.
    resetDatabase();

    if (typeof indexedDB !== "undefined" && indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(
            (db) =>
              new Promise<void>((resolve) => {
                if (!db.name) {
                  resolve();
                  return;
                }
                const req = indexedDB.deleteDatabase(db.name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              }),
          ),
        );
      } catch {
        // indexedDB.databases() may not be available in all browsers; ignore errors
      }
    }
  }, [handleClearSession]);

  const switchOrganization = useCallback(
    async (org: Organization) => {
      if (!org?.id) return;
      if (org.id === organization?.id) return;

      const { error } = await authClient.organization.setActive({
        organizationId: org.id,
      });

      if (error) {
        throw new Error((error as { message?: string })?.message || "Failed to switch workspace");
      }

      localStorage.setItem("active_org_slug", org.slug);
      // Keep the cached org id in sync so the post-reload fetchSession does not
      // treat this intentional switch as an external auth-app change.
      try {
        localStorage.setItem(CACHED_ORG_KEY, JSON.stringify(org));
      } catch {
        // ignore quota / private-mode failures
      }
      clearPermissionCache();

      // Drop the previous org's local-first cache before navigating. Sync alone
      // cannot remove foreign docs; ensureOrgScopedData wipes on slug mismatch
      // and refuses to leave the old watermark in place.
      try {
        resetReplication();
        const db = await getDatabase();
        await ensureOrgScopedData(db, org.slug);
      } catch (err) {
        console.warn("[AuthContext] Failed to clear local data on org switch:", err);
      }

      window.location.assign(`/${org.slug}/folders`);
    },
    [organization?.id],
  );

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      organization,
      organizations,
      hasAcceptedTrial,
      isAuthenticated: !!user,
      isLoading,
      refetch: fetchSession,
      switchOrganization,
      logout,
    }),
    [
      user,
      organization,
      organizations,
      hasAcceptedTrial,
      isLoading,
      fetchSession,
      switchOrganization,
      logout,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isDemoMode()) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }
  return <StandardAuthProvider>{children}</StandardAuthProvider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

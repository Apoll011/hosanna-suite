"use client";

import { authClient } from "@/lib/auth/client";
import { clearCachedOrg } from "@/lib/organization/cache";
import {
  clearCachedUser,
  readCachedUser,
  toCachedUser,
  writeCachedUser,
  type CachedAuthUser,
} from "@/lib/session/cache";
import {
  clearPersonalSettingsCache,
  getPersistedSettingsJson,
  syncSettingsFromMetadata,
} from "@hosanna/auth";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type UseAuthUserOptions = {
  /** User from a server session — skips the cold-load spinner. */
  initialUser?: CachedAuthUser | null;
  loginRedirect?: string;
  requireAuth?: boolean;
};

type UseAuthUserResult = {
  user: CachedAuthUser | null;
  /** No user yet (no server seed, no cache) and network has not resolved. */
  isLoading: boolean;
  /** Background getSession in flight; UI should stay visible. */
  isRefreshing: boolean;
  refresh: () => Promise<CachedAuthUser | null>;
  setUser: Dispatch<SetStateAction<CachedAuthUser | null>>;
  clear: () => void;
};

function seedUser(initialUser?: CachedAuthUser | null): CachedAuthUser | null {
  if (initialUser) return initialUser;
  return readCachedUser();
}

/**
 * Prefer a server-provided user, then localStorage, then network.
 * Never blank the page for a background session refresh.
 */
export function useAuthUser(options: UseAuthUserOptions = {}): UseAuthUserResult {
  const {
    initialUser = null,
    loginRedirect = "/login?redirect=/account",
    requireAuth = true,
  } = options;
  const loginRedirectRef = useRef(loginRedirect);
  const requireAuthRef = useRef(requireAuth);
  loginRedirectRef.current = loginRedirect;
  requireAuthRef.current = requireAuth;

  const [user, setUser] = useState<CachedAuthUser | null>(() => seedUser(initialUser));
  const [isLoading, setIsLoading] = useState(() => seedUser(initialUser) === null);
  const [isRefreshing, setIsRefreshing] = useState(() => seedUser(initialUser) !== null);

  const clear = useCallback(() => {
    clearCachedUser();
    clearPersonalSettingsCache();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const session = await authClient.getSession();

      // Network / client errors: keep cached UI, do not bounce to login.
      if (session.error) {
        console.warn("[auth] getSession failed:", session.error);
        return readCachedUser();
      }

      const rawUser = session.data?.user as CachedAuthUser | undefined;
      const next = rawUser ? toCachedUser(rawUser) : null;

      if (!next) {
        clearCachedUser();
        clearCachedOrg();
        clearPersonalSettingsCache();
        setUser(null);
        if (requireAuthRef.current && typeof window !== "undefined") {
          window.location.replace(loginRedirectRef.current);
        }
        return null;
      }

      const previous = readCachedUser();
      if (previous?.id && previous.id !== next.id) {
        // Different account in the same browser — drop the prior org snapshot.
        clearCachedOrg();
        clearPersonalSettingsCache();
        try {
          localStorage.removeItem("active_org_slug");
        } catch {
          /* ignore */
        }
      }

      // Prefer local personal-settings when caching so a lagging metadata
      // round-trip cannot regress an optimistic edit made on this origin.
      const localSettingsJson = getPersistedSettingsJson();
      const userToCache: CachedAuthUser = localSettingsJson
        ? { ...next, metadata: localSettingsJson }
        : next;

      // Always reconcile cross-app theme/language from server metadata.
      syncSettingsFromMetadata(rawUser?.metadata ?? next.metadata);

      writeCachedUser(userToCache);
      setUser(userToCache);
      return userToCache;
    } catch (err) {
      console.warn("[auth] getSession threw:", err);
      return readCachedUser();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser) writeCachedUser(initialUser);
    void refresh();
  }, [initialUser, refresh]);

  return { user, isLoading, isRefreshing, refresh, setUser, clear };
}

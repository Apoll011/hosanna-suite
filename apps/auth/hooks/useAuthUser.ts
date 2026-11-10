"use client";

import { authClient } from "@/lib/auth-client";
import {
  clearCachedUser,
  readCachedUser,
  toCachedUser,
  writeCachedUser,
  type CachedAuthUser,
} from "@/lib/session-cache";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

type UseAuthUserOptions = {
  loginRedirect?: string;
  requireAuth?: boolean;
};

type UseAuthUserResult = {
  user: CachedAuthUser | null;
  /** No cached user yet and network has not resolved. */
  isLoading: boolean;
  /** Cached UI is showing while a fresh getSession runs. */
  isRefreshing: boolean;
  refresh: () => Promise<CachedAuthUser | null>;
  setUser: Dispatch<SetStateAction<CachedAuthUser | null>>;
  clear: () => void;
};

/**
 * Hydrate account UI from localStorage immediately, then refresh from the network.
 * Avoids a blank spinner on every /account visit when a prior session was cached.
 */
export function useAuthUser(options: UseAuthUserOptions = {}): UseAuthUserResult {
  const { loginRedirect = "/login?redirect=/account", requireAuth = true } = options;

  const [user, setUser] = useState<CachedAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clear = useCallback(() => {
    clearCachedUser();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const session = await authClient.getSession();
      const next = session.data?.user
        ? toCachedUser(session.data.user as CachedAuthUser)
        : null;

      if (!next) {
        clearCachedUser();
        setUser(null);
        if (requireAuth && typeof window !== "undefined") {
          window.location.replace(loginRedirect);
        }
        return null;
      }

      writeCachedUser(next);
      setUser(next);
      return next;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loginRedirect, requireAuth]);

  useEffect(() => {
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
    }
    void refresh();
  }, [refresh]);

  return { user, isLoading, isRefreshing, refresh, setUser, clear };
}

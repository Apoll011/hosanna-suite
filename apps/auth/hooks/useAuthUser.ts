"use client";

import { authClient } from "@/lib/auth-client";
import {
  clearCachedUser,
  readCachedUser,
  toCachedUser,
  writeCachedUser,
  type CachedAuthUser,
} from "@/lib/session-cache";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

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
 * Show cached account UI before paint when localStorage has a user, then refresh.
 */
export function useAuthUser(options: UseAuthUserOptions = {}): UseAuthUserResult {
  const { loginRedirect = "/login?redirect=/account", requireAuth = true } = options;
  const loginRedirectRef = useRef(loginRedirect);
  const requireAuthRef = useRef(requireAuth);
  loginRedirectRef.current = loginRedirect;
  requireAuthRef.current = requireAuth;

  // Match SSR + first client paint (no window on server); hydrate from cache in layout effect.
  const [user, setUser] = useState<CachedAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didHydrateCache = useRef(false);

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
        if (requireAuthRef.current && typeof window !== "undefined") {
          window.location.replace(loginRedirectRef.current);
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
  }, []);

  useLayoutEffect(() => {
    if (didHydrateCache.current) return;
    didHydrateCache.current = true;
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
      setIsRefreshing(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, isLoading, isRefreshing, refresh, setUser, clear };
}

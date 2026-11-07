/**
 * React hooks for RBAC permission and role checks.
 *
 * @module permissions/client
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "../authClient";
import {
  statement,
  type PermissionRequest,
  type PermissionString,
  type Resource,
} from "./permission";
import { roles, type AppRole } from "./roles";

// ---------------------------------------------------------------------------
// 1. Core Caching & Promise Deduplication Layer
// ---------------------------------------------------------------------------

interface PermResult {
  granted: boolean;
  loading: boolean;
  error: Error | null;
}

const DEFAULT_RESULT: PermResult = {
  granted: false,
  loading: true,
  error: null,
};

// Stores resolved booleans
const permCache = new Map<string, boolean>();
// Stores in-flight Promises so concurrent components share the exact same network request
const pendingPerms = new Map<string, Promise<boolean>>();

export function clearPermissionCache(): void {
  permCache.clear();
  pendingPerms.clear();
}

// ---------------------------------------------------------------------------
// 2. Batching Helpers
// ---------------------------------------------------------------------------

/**
 * Groups ["project.create", "sale.create", "project.delete"]
 * into { project: ["create", "delete"], sale: ["create"] }
 */
function groupPermissions(permissions: PermissionString[]): PermissionRequest {
  const grouped = {} as Record<Resource, string[]>;
  for (const perm of permissions) {
    const dotIndex = perm.indexOf(".");
    const resource = perm.slice(0, dotIndex) as Resource;
    const action = perm.slice(dotIndex + 1);

    if (!grouped[resource]) grouped[resource] = [];
    if (!grouped[resource].includes(action)) grouped[resource].push(action);
  }
  return grouped as PermissionRequest;
}

/** Creates a deterministic string key for caching (e.g., "project:create,delete|sale:create") */
function getCacheKey(permissions: PermissionString[]): string {
  if (permissions.length === 0) return "empty";
  const grouped = groupPermissions(permissions);
  return Object.keys(grouped)
    .sort()
    .map((res) => `${res}:${grouped[res as Resource]!.sort().join(",")}`)
    .join("|");
}

// ---------------------------------------------------------------------------
// 3. Super Efficient Fetchers
// ---------------------------------------------------------------------------

/**
 * Core fetcher. Batches permissions, deduplicates requests, and pre-populates cache.
 */
function fetchPermissionsBatch(
  permissions: PermissionString[],
): Promise<boolean> {
  if (permissions.length === 0) return Promise.resolve(true);

  const cacheKey = getCacheKey(permissions);

  // 1. If we already have the answer, return it instantly
  if (permCache.has(cacheKey)) return Promise.resolve(permCache.get(cacheKey)!);

  // 2. If this EXACT check is already in-flight from another component, piggyback on it
  if (pendingPerms.has(cacheKey)) return pendingPerms.get(cacheKey)!;

  // 3. Fire a single API call for all permissions
  const promise = authClient.organization
    .hasPermission({
      permissions: groupPermissions(permissions) as Record<string, string[]>,
    })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message ?? "Permission check failed");
      const granted = data?.success ?? false;

      // Cache the result for this specific combination
      permCache.set(cacheKey, granted);

      // OPTIMIZATION: If the batch was GRANTED, we know every individual permission
      // inside it is ALSO granted. We can pre-populate the cache for future checks!
      if (granted) {
        permissions.forEach((p) => permCache.set(getCacheKey([p]), true));
      }

      return granted;
    })
    .finally(() => {
      pendingPerms.delete(cacheKey);
    });

  pendingPerms.set(cacheKey, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// 4. React Hooks
// ---------------------------------------------------------------------------

/** Checks a single permission. */
export function useCan(permission: PermissionString): PermResult {
  return useCanAll(useMemo(() => [permission], [permission]));
}

export function useCannot(permission: PermissionString): {
  denied: boolean;
  loading: boolean;
  error: Error | null;
} {
  const { granted, loading, error } = useCan(permission);
  return { denied: !granted, loading, error };
}

/**
 * Returns a value based on whether the permission is granted or denied.
 */
export function usePermissionValue<T, D = null>(
  permission: PermissionString,
  grantedValue: T,
  deniedValue: D = null as unknown as D,
): { value: T | D; loading: boolean; error: Error | null } {
  const { granted, loading, error } = useCan(permission);
  return {
    value: loading ? deniedValue : granted ? grantedValue : deniedValue,
    loading,
    error,
  };
}

// ---------------------------------------------------------------------------
// Role Helpers
// ---------------------------------------------------------------------------

export function checkPermissionsLocally(
  permissions: PermissionString[],
  role: AppRole | null,
): boolean | null {
  if (!role || !(role in roles)) return null;
  const roleConfig = roles[role];
  for (const perm of permissions) {
    const dotIndex = perm.indexOf(".");
    const resource = perm.slice(
      0,
      dotIndex,
    ) as keyof typeof roleConfig.statements;
    const action = perm.slice(dotIndex + 1);
    const allowedActions = roleConfig.statements[resource];
    const isGranted =
      Array.isArray(allowedActions) && allowedActions.includes(action);
    if (!isGranted) return false;
  }
  return true;
}

export function checkPermissionAnyLocally(
  permissions: PermissionString[],
  role: AppRole | null,
): boolean | null {
  if (!role || !(role in roles)) return null;
  const roleConfig = roles[role];
  for (const perm of permissions) {
    const dotIndex = perm.indexOf(".");
    const resource = perm.slice(
      0,
      dotIndex,
    ) as keyof typeof roleConfig.statements;
    const action = perm.slice(dotIndex + 1);
    const allowedActions = roleConfig.statements[resource];
    if (Array.isArray(allowedActions) && allowedActions.includes(action)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if ALL permissions are granted.
 * Super efficient: Fires exactly ONE batched API request, checking synchronous cache/role first.
 */
export function useCanAll(permissions: PermissionString[]): PermResult {
  const { role } = useActiveRole();
  const cacheKey = useMemo(() => getCacheKey(permissions), [permissions]);

  const [result, setResult] = useState<PermResult>(() => {
    if (permCache.has(cacheKey)) {
      return {
        granted: permCache.get(cacheKey)!,
        loading: false,
        error: null,
      };
    }
    const local = checkPermissionsLocally(permissions, role);
    if (local !== null) {
      permCache.set(cacheKey, local);
      return {
        granted: local,
        loading: false,
        error: null,
      };
    }
    return DEFAULT_RESULT;
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Fast path: if already cached, skip setting loading state entirely to prevent flicker
    if (permCache.has(cacheKey)) {
      const cached = permCache.get(cacheKey)!;
      setResult((prev) => {
        if (!prev.loading && prev.granted === cached && prev.error === null) {
          return prev;
        }
        return { granted: cached, loading: false, error: null };
      });
      return;
    }

    const local = checkPermissionsLocally(permissions, role);
    if (local !== null) {
      permCache.set(cacheKey, local);
      setResult({ granted: local, loading: false, error: null });
      return;
    }

    setResult({ granted: false, loading: true, error: null });

    fetchPermissionsBatch(permissions)
      .then((granted) => {
        if (mounted.current)
          setResult({ granted, loading: false, error: null });
      })
      .catch((error) => {
        if (mounted.current)
          setResult({ granted: false, loading: false, error });
      });

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cacheKey deterministically tracks permissions
  }, [cacheKey, role]);

  return result;
}

/**
 * Checks if ANY permissions are granted.
 * Better-Auth API is an AND check by default, so we evaluate them individually
 * concurrently. Caching handles the efficiency natively.
 */
export function useCanAny(permissions: PermissionString[]): PermResult {
  const { role } = useActiveRole();
  const cacheKey = useMemo(() => getCacheKey(permissions), [permissions]);

  const [result, setResult] = useState<PermResult>(() => {
    for (const p of permissions) {
      if (permCache.get(getCacheKey([p])) === true) {
        return { granted: true, loading: false, error: null };
      }
    }
    if (permCache.has(cacheKey)) {
      return {
        granted: permCache.get(cacheKey)!,
        loading: false,
        error: null,
      };
    }
    const local = checkPermissionAnyLocally(permissions, role);
    if (local !== null) {
      return { granted: local, loading: false, error: null };
    }
    return DEFAULT_RESULT;
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const checkAny = async () => {
      // 1. Fast short-circuit: Are any already cached as true?
      for (const p of permissions) {
        if (permCache.get(getCacheKey([p])) === true) {
          if (mounted.current) {
            setResult((prev) =>
              !prev.loading && prev.granted && prev.error === null
                ? prev
                : { granted: true, loading: false, error: null },
            );
          }
          return;
        }
      }

      if (permCache.has(cacheKey)) {
        const cached = permCache.get(cacheKey)!;
        if (mounted.current) {
          setResult((prev) =>
            !prev.loading && prev.granted === cached && prev.error === null
              ? prev
              : { granted: cached, loading: false, error: null },
          );
        }
        return;
      }

      const local = checkPermissionAnyLocally(permissions, role);
      if (local !== null) {
        if (mounted.current) {
          setResult({ granted: local, loading: false, error: null });
        }
        return;
      }

      setResult({ granted: false, loading: true, error: null });

      try {
        // 2. Fire individual checks concurrently. Promise Deduplication ensures
        // we don't spam the network if other components are checking these same perms.
        const results = await Promise.all(
          permissions.map((p) => fetchPermissionsBatch([p])),
        );
        const granted = results.some(Boolean);

        if (mounted.current)
          setResult({ granted, loading: false, error: null });
      } catch (error) {
        if (mounted.current)
          setResult({ granted: false, loading: false, error: error as Error });
      }
    };

    checkAny();

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cacheKey deterministically tracks permissions
  }, [cacheKey, role]);

  return result;
}

// ---------------------------------------------------------------------------
// Role Hooks
// ---------------------------------------------------------------------------

export function useActiveRole(): {
  role: AppRole | null;
  loading: boolean;
  error: Error | null;
} {
  const { user, isLoading } = useAuth();

  return {
    role: (user?.role as AppRole) ?? null,
    loading: isLoading,
    error: null,
  };
}

export function useRole(role: AppRole) {
  const { role: activeRole, loading, error } = useActiveRole();
  return { matched: activeRole === role, loading, error };
}

export function useAnyRole(...roles: AppRole[]) {
  const { role: activeRole, loading, error } = useActiveRole();
  return {
    matched: activeRole ? roles.includes(activeRole) : false,
    loading,
    error,
  };
}
/**
 * Automatically computes all possible permission strings
 * (e.g. "song.create", "billing.manage") from your `statement` object.
 */
const ALL_PERMISSIONS: PermissionString[] = Object.entries(statement).flatMap(
  ([resource, actions]) =>
    (actions as readonly string[]).map(
      (action) => `${resource}.${action}` as PermissionString,
    ),
);

/**
 * Evaluates and pre-caches all permissions for a given role
 * using the role's statements directly.
 */
export function preloadPermissionsForRole(role: AppRole | null): void {
  if (!role || !(role in roles)) return;

  const roleConfig = roles[role];

  ALL_PERMISSIONS.forEach((perm) => {
    const dotIndex = perm.indexOf(".");
    const resource = perm.slice(
      0,
      dotIndex,
    ) as keyof typeof roleConfig.statements;
    const action = perm.slice(dotIndex + 1);

    // Check if the action is granted for the resource in this role's statements
    const allowedActions = roleConfig.statements[resource];
    const isGranted =
      Array.isArray(allowedActions) && allowedActions.includes(action);

    const cacheKey = getCacheKey([perm]);
    permCache.set(cacheKey, isGranted);
  });
}

/**
 * React hook to automatically hydrate the cache
 * as soon as the authenticated user's role is loaded.
 */
export function usePreloadPermissions(): { isReady: boolean } {
  const { role, loading } = useActiveRole();

  useEffect(() => {
    if (role && !loading) {
      preloadPermissionsForRole(role);
    }
  }, [role, loading]);

  return { isReady: !loading && role !== null };
}

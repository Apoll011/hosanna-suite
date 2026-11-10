/**
 * Local cache of the signed-in user for instant account UI while getSession refreshes.
 */

export type CachedAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  twoFactorEnabled?: boolean;
};

const CACHE_KEY = "hosanna.auth.cached_user";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readCachedUser(): CachedAuthUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthUser;
    if (!parsed || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedUser(user: CachedAuthUser): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    /* quota / private mode */
  }
}

export function clearCachedUser(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function toCachedUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  twoFactorEnabled?: boolean | null;
}): CachedAuthUser {
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    role: user.role ?? null,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}

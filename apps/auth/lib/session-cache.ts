/**
 * Local cache for account-center data so revisits paint instantly while network refreshes.
 */

export type CachedAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  twoFactorEnabled?: boolean;
};

export type CachedSessionRow = {
  id: string;
  createdAt: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CachedSocialAccount = {
  id: string;
  providerId: string;
  accountId: string;
};

export type CachedAuditEvent = {
  eventKey: string;
  eventType: string;
  createdAt: string;
  eventData?: Record<string, unknown>;
  location?: { ipAddress?: string; city?: string; country?: string };
};

export type CachedLoginHistory = {
  events: CachedAuditEvent[];
  total: number;
};

const USER_KEY = "hosanna.auth.cached_user";
const SESSIONS_KEY = "hosanna.auth.cached_sessions";
const ACCOUNTS_KEY = "hosanna.auth.cached_accounts";
const LOGIN_HISTORY_KEY = "hosanna.auth.cached_login_history";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function removeKey(key: string): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readCachedUser(): CachedAuthUser | null {
  const parsed = readJson<CachedAuthUser>(USER_KEY);
  if (!parsed || typeof parsed.id !== "string") return null;
  return parsed;
}

export function writeCachedUser(user: CachedAuthUser): void {
  writeJson(USER_KEY, user);
}

export function readCachedSessions(): CachedSessionRow[] | null {
  const parsed = readJson<CachedSessionRow[]>(SESSIONS_KEY);
  return Array.isArray(parsed) ? parsed : null;
}

export function writeCachedSessions(sessions: CachedSessionRow[]): void {
  writeJson(
    SESSIONS_KEY,
    sessions.map((s) => ({
      ...s,
      createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date(s.createdAt).toISOString(),
    })),
  );
}

export function readCachedAccounts(): CachedSocialAccount[] | null {
  const parsed = readJson<CachedSocialAccount[]>(ACCOUNTS_KEY);
  return Array.isArray(parsed) ? parsed : null;
}

export function writeCachedAccounts(accounts: CachedSocialAccount[]): void {
  writeJson(ACCOUNTS_KEY, accounts);
}

export function readCachedLoginHistory(): CachedLoginHistory | null {
  const parsed = readJson<CachedLoginHistory>(LOGIN_HISTORY_KEY);
  if (!parsed || !Array.isArray(parsed.events)) return null;
  return {
    events: parsed.events,
    total: typeof parsed.total === "number" ? parsed.total : parsed.events.length,
  };
}

export function writeCachedLoginHistory(history: CachedLoginHistory): void {
  writeJson(LOGIN_HISTORY_KEY, history);
}

/** Clears every account-center cache entry (user + sections). */
export function clearCachedUser(): void {
  removeKey(USER_KEY);
  removeKey(SESSIONS_KEY);
  removeKey(ACCOUNTS_KEY);
  removeKey(LOGIN_HISTORY_KEY);
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

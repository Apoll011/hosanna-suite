import { env } from "../config/env.js";

export type AuthSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

export type AuthSession = {
  id: string;
  userId: string;
  activeOrganizationId?: string | null;
  activeTeamId?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

export type SessionResult = {
  session: AuthSession;
  user: AuthSessionUser;
  member?: { role?: string | null } | null;
} | null;

function authCandidates(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [env.internalAuthUrl, env.authUrl, env.publicAppUrl]) {
    if (!raw) continue;
    const base = raw.replace(/\/+$/, "");
    if (!base || seen.has(base)) continue;
    seen.add(base);
    out.push(base);
  }
  if (out.length === 0) {
    throw new Error(
      "INTERNAL_AUTH_URL (or AUTH_URL / PUBLIC_APP_URL) is required for session validation",
    );
  }
  return out;
}

function toHeaders(input?: Headers | Record<string, string> | Iterable<[string, string]>): Headers {
  if (!input) return new Headers();
  if (input instanceof Headers) return new Headers(input);
  return new Headers(input as Record<string, string>);
}

/** Allow Next/auth cold paths without turning slow answers into 401s. */
const GET_SESSION_TIMEOUT_MS = 12_000;

/**
 * Validate a session via the auth app (cookie / bearer).
 *
 * Tries `INTERNAL_AUTH_URL` / related-project host first, then `AUTH_URL`.
 * Preview related hosts are often `*.vercel.app` behind Vercel SSO — those
 * respond 302 to login HTML, which previously became a silent 401 until a
 * later request happened to hit `auth.hosanna.live`.
 */
export async function getSession(input?: {
  headers?: Headers | Record<string, string>;
}): Promise<SessionResult> {
  const headers = toHeaders(input?.headers);

  for (const base of authCandidates()) {
    let res: Response;
    try {
      res = await fetch(`${base}/api/auth/get-session`, {
        method: "GET",
        headers,
        // Never follow Vercel deployment-protection SSO redirects.
        redirect: "manual",
        signal: AbortSignal.timeout(GET_SESSION_TIMEOUT_MS),
      });
    } catch {
      continue;
    }

    // 3xx = deployment protection / wrong host — try the next candidate.
    if (res.status >= 300 && res.status < 400) continue;
    if (!res.ok) continue;

    let data: SessionResult | { session?: null; user?: null } | null;
    try {
      data = (await res.json()) as SessionResult | { session?: null; user?: null } | null;
    } catch {
      continue;
    }
    if (!data?.session || !data?.user) return null;
    return data as Exclude<SessionResult, null>;
  }

  return null;
}

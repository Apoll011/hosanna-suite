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

function authBaseUrl(): string {
  const base = (env.internalAuthUrl ?? env.authUrl ?? env.publicAppUrl).replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "INTERNAL_AUTH_URL (or AUTH_URL / PUBLIC_APP_URL) is required for session validation",
    );
  }
  return base;
}

function toHeaders(input?: Headers | Record<string, string> | Iterable<[string, string]>): Headers {
  if (!input) return new Headers();
  if (input instanceof Headers) return new Headers(input);
  return new Headers(input as Record<string, string>);
}

const GET_SESSION_TIMEOUT_MS = 2_500;

/** Validate a session via the auth app (cookie / bearer), not a local Better Auth instance. */
export async function getSession(input?: {
  headers?: Headers | Record<string, string>;
}): Promise<SessionResult> {
  const headers = toHeaders(input?.headers);
  let res: Response;
  try {
    res = await fetch(`${authBaseUrl()}/api/auth/get-session`, {
      method: "GET",
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(GET_SESSION_TIMEOUT_MS),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = (await res.json()) as SessionResult | { session?: null; user?: null } | null;
  if (!data?.session || !data?.user) return null;
  return data as Exclude<SessionResult, null>;
}

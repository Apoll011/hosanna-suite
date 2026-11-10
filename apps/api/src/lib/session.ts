import { auth } from "./auth.js";

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

function toHeaders(input?: Headers | Record<string, string> | Iterable<[string, string]>): Headers {
  if (!input) return new Headers();
  if (input instanceof Headers) return new Headers(input);
  return new Headers(input as Record<string, string>);
}

/** Validate a session locally via shared Better Auth (cookie / bearer). */
export async function getSession(input?: {
  headers?: Headers | Record<string, string>;
}): Promise<SessionResult> {
  try {
    const data = await auth.api.getSession({
      headers: toHeaders(input?.headers),
    });
    if (!data?.session || !data?.user) return null;
    return data as Exclude<SessionResult, null>;
  } catch {
    return null;
  }
}

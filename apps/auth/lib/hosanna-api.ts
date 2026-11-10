/**
 * Shared Hosanna API helpers for the auth app.
 *
 * Base URL is `NEXT_PUBLIC_API_URL` (must include the `/api` suffix, same as
 * Studio's `VITE_API_URL`). Cookie session via `credentials: "include"`.
 *
 * API middleware requires `session.activeOrganizationId` — callers should pass
 * `organizationId` so we sync Better Auth's active org before the request.
 */

import { authClient } from "@/lib/auth-client";

export function apiBaseUrl(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || undefined;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000/api";
    }
    if (host.endsWith(".hosanna.live") || host === "hosanna.live") {
      const prefix = host.startsWith("dev-") || host.includes("dev-") ? "dev-" : "";
      return `https://${prefix}api.hosanna.live/api`;
    }
  }
  return "https://api.hosanna.live/api";
}

export async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (body?.error) {
      if (typeof body.error === "string") return body.error;
      if (body.error.message) return body.error.message;
    }
    if (typeof body?.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

type SessionPayload = {
  session?: { activeOrganizationId?: string | null } | null;
  user?: unknown;
} | null;

/** Keep Better Auth's active org in sync so API cookie sessions resolve a workspace. */
export async function ensureActiveOrganizationSession(
  organizationId?: string | null,
): Promise<void> {
  if (!organizationId || typeof window === "undefined") return;

  const { data } = (await authClient.getSession({ query: {} })) as {
    data?: SessionPayload;
  };
  const activeId = data?.session?.activeOrganizationId ?? null;
  if (activeId === organizationId) return;

  await authClient.organization.setActive({ organizationId });
}

export type ApiFetchOptions = RequestInit & {
  /** When set, syncs the auth session's active organization before calling the API. */
  organizationId?: string | null;
};

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchOptions,
): Promise<T> {
  const { organizationId, ...requestInit } = init ?? {};
  await ensureActiveOrganizationSession(organizationId);

  const headers = new Headers(requestInit.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...requestInit,
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error(await readApiError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

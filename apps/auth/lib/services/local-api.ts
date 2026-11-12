/**
 * Same-origin API helpers for routes hosted on the auth app
 * (notifications, backup, billing probes).
 */

import { authClient } from "@/lib/auth/client";

export async function ensureActiveOrganizationSession(
  organizationId?: string | null,
): Promise<void> {
  if (!organizationId || typeof window === "undefined") return;

  const { data } = (await authClient.getSession({ query: {} })) as {
    data?: {
      session?: { activeOrganizationId?: string | null } | null;
    } | null;
  };
  const activeId = data?.session?.activeOrganizationId ?? null;
  if (activeId === organizationId) return;

  await authClient.organization.setActive({ organizationId });
}

export async function readLocalApiError(res: Response): Promise<string> {
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

export type LocalApiFetchOptions = RequestInit & {
  organizationId?: string | null;
};

export async function localApiFetch<T>(
  path: string,
  init?: LocalApiFetchOptions,
): Promise<T> {
  const { organizationId, ...requestInit } = init ?? {};
  await ensureActiveOrganizationSession(organizationId);

  const headers = new Headers(requestInit.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api${path.startsWith("/") ? path : `/${path}`}`, {
    ...requestInit,
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error(await readLocalApiError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

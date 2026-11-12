import { getAuthAppUrl } from "../lib/authUrl";

/** Base URL for identity-hosted APIs (notifications, backup, billing probes). */
export function authApiBaseUrl(): string {
  return `${getAuthAppUrl().replace(/\/$/, "")}/api`;
}

export async function authApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${authApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        error?: string | { message?: string };
        message?: string;
      };
      if (typeof body.error === "string") message = body.error;
      else if (body.error && typeof body.error === "object" && body.error.message) {
        message = body.error.message;
      } else if (typeof body.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

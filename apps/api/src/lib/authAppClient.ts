import { env } from "../config/env.js";
import { attachTrustedOidcHeader } from "./vercelOidc.js";

const AUTH_APP_TIMEOUT_MS = 15_000;

function authBaseUrl(): string {
  const base = (env.authUrl ?? env.publicAppUrl).replace(/\/+$/, "");
  if (!base) throw new Error("AUTH_URL (or PUBLIC_APP_URL) is required to call the auth app");
  return base;
}

async function authAppFetch(
  path: string,
  opts: {
    method?: "GET" | "POST";
    /** Session / MCP bearer token for the acting user. */
    bearerToken: string;
    body?: unknown;
  },
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const headers = await attachTrustedOidcHeader(
    new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${opts.bearerToken}`,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    }),
  );

  let res: Response;
  try {
    res = await fetch(`${authBaseUrl()}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(AUTH_APP_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Auth app unreachable (${authBaseUrl()}): ${message}`);
  }

  // Deployment protection SSO redirect = missing/invalid Trusted Sources OIDC.
  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      "Auth app redirected (deployment protection). Trusted Sources OIDC may be missing.",
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  return { ok: res.ok, status: res.status, data, text };
}

export type AuthAppInviteResult = {
  id: string;
  email: string;
  role: string | null;
  organizationId: string;
  inviterId: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
};

/**
 * Invite a member via the full auth app (sends invitation email).
 * Slim in-API Better Auth has no mail — do not create invitations locally.
 */
export async function inviteMemberViaAuthApp(opts: {
  bearerToken: string;
  email: string;
  role: string;
  organizationId: string;
  resend?: boolean;
}): Promise<
  | { ok: true; invitation: AuthAppInviteResult; resent: boolean }
  | { ok: false; status: number; message: string; code?: string }
> {
  const body = {
    email: opts.email,
    role: opts.role,
    organizationId: opts.organizationId,
    ...(opts.resend ? { resend: true } : {}),
  };

  const { ok, status, data } = await authAppFetch("/api/auth/organization/invite-member", {
    method: "POST",
    bearerToken: opts.bearerToken,
    body,
  });

  if (ok && data && typeof data === "object") {
    const inv = data as Record<string, unknown>;
    return {
      ok: true,
      resent: Boolean(opts.resend),
      invitation: {
        id: String(inv.id ?? ""),
        email: String(inv.email ?? opts.email),
        role: inv.role != null ? String(inv.role) : opts.role,
        organizationId: String(inv.organizationId ?? opts.organizationId),
        inviterId: String(inv.inviterId ?? ""),
        status: String(inv.status ?? "pending"),
        expiresAt:
          inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : String(inv.expiresAt ?? ""),
        createdAt:
          inv.createdAt != null
            ? inv.createdAt instanceof Date
              ? inv.createdAt.toISOString()
              : String(inv.createdAt)
            : undefined,
      },
    };
  }

  const errObj = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const message =
    (typeof errObj.message === "string" && errObj.message) ||
    (typeof errObj.error === "string" && errObj.error) ||
    (errObj.error &&
    typeof errObj.error === "object" &&
    typeof (errObj.error as { message?: unknown }).message === "string"
      ? String((errObj.error as { message: string }).message)
      : null) ||
    `Auth app invite failed (${status})`;
  const code =
    typeof errObj.code === "string"
      ? errObj.code
      : errObj.error &&
          typeof errObj.error === "object" &&
          typeof (errObj.error as { code?: unknown }).code === "string"
        ? String((errObj.error as { code: string }).code)
        : undefined;

  return { ok: false, status, message, code };
}

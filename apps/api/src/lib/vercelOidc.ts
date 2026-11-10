import { getVercelOidcToken } from "@vercel/oidc";

/** Header Vercel Deployment Protection expects from Trusted Sources callers. */
export const VERCEL_TRUSTED_OIDC_HEADER = "x-vercel-trusted-oidc-idp-token";

/**
 * Attach this project's short-lived OIDC token so `hosanna-server` can call
 * protected `hosanna-auth` deployments (Trusted Sources).
 * No-op locally / when OIDC is unavailable.
 */
export async function attachTrustedOidcHeader(headers: Headers): Promise<Headers> {
  const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers);
  try {
    const token = await getVercelOidcToken();
    if (token) out.set(VERCEL_TRUSTED_OIDC_HEADER, token);
  } catch {
    /* local / non-Vercel */
  }
  return out;
}

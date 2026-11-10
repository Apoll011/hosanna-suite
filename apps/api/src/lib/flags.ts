/**
 * Vercel Flags — Express uses `@vercel/flags-core` (Flags SDK is Next/SvelteKit only).
 *
 * Flag `auth-mount` (string) lives on project `embrace-co/hosanna-server`:
 *   local | delegate | off
 *
 * Call `evaluate*()` from request handlers so OIDC can come from request context.
 * Do not `initialize()` at module scope.
 */
import { flagsClient } from "@vercel/flags-core";

import { env } from "../config/env.js";

export type AuthMountMode = "local" | "delegate" | "off";

const AUTH_MOUNT_KEY = "auth-mount";
const AUTH_MOUNT_VARIANTS = new Set<AuthMountMode>(["local", "delegate", "off"]);

/** Fallback when the flag is missing, archived, or evaluation fails. */
export function defaultAuthMount(authUrl: string | undefined = env.authUrl): AuthMountMode {
  return authUrl ? "delegate" : "local";
}

export function coerceAuthMount(value: unknown, fallback: AuthMountMode): AuthMountMode {
  if (typeof value === "string" && AUTH_MOUNT_VARIANTS.has(value as AuthMountMode)) {
    return value as AuthMountMode;
  }
  return fallback;
}

/**
 * Resolve how this API serves Better Auth HTTP for the current request.
 * Dashboard variants: local (Host), delegate (Redirect), off (Disabled).
 */
export async function evaluateAuthMount(): Promise<AuthMountMode> {
  const fallback = defaultAuthMount();
  try {
    const result = await flagsClient.evaluate<string>(AUTH_MOUNT_KEY, fallback);
    return coerceAuthMount(result.value, fallback);
  } catch {
    return fallback;
  }
}

import { i18nClient } from "@better-auth/i18n/client";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/client";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { inboxClient } from "better-inbox/client";
import { ac } from "./permission.js";
import { roles } from "./roles.js";

export interface CreateHosannaAuthClientOptions {
  /** Better Auth base URL (auth app origin). */
  baseURL: string;
  /** Path for the 2FA challenge page (relative to the auth UI). */
  twoFactorPage?: string;
}

/** Shared browser/client Better Auth instance for Hosanna apps. */
// Explicit `any` — Better Auth client inference is non-portable for declaration emit.
export function createHosannaAuthClient(options: CreateHosannaAuthClientOptions): any {
  return createAuthClient({
    baseURL: options.baseURL.replace(/\/+$/, ""),
    fetchOptions: {
      credentials: "include",
    },
    plugins: [
      i18nClient(),
      dashClient(),
      sentinelClient({
        autoSolveChallenge: true,
      }),
      inboxClient(),
      twoFactorClient({
        twoFactorPage: options.twoFactorPage ?? "/two-factor",
      }),
      stripeClient({
        subscription: true,
      }),
      organizationClient({
        ac,
        roles,
        teams: {
          enabled: true,
        },
      }),
    ],
  });
}

export type HosannaAuthClient = any;

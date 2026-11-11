import { i18nClient } from "@better-auth/i18n/client";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/client";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { inboxClient } from "better-inbox/client";
import { ac } from "./authorization/permission.js";
import { roles } from "./authorization/roles.js";

export interface CreateHosannaAuthClientOptions {
  /** Better Auth base URL (auth app origin, e.g. https://auth.hosanna.live). */
  baseURL: string;
  /**
   * Page Better Auth sends the browser to when 2FA is required.
   * Defaults to `{baseURL}/two-factor` so Studio and other apps land on the
   * auth app — not a Studio-relative path.
   */
  twoFactorPage?: string;
  /** Better Auth Infra project identify URL for sentinel (optional). */
  identifyUrl?: string;
  fetchOptions?: {
    credentials?: "include" | "omit" | "same-origin";
    headers?: Record<string, string>;
  };
}

/**
 * Shared browser Better Auth client for Hosanna apps (auth app, Studio, etc.).
 *
 * 2FA page defaults to the auth host so consumers do not need to pass it unless
 * they override the route.
 */
// Explicit `any` — Better Auth client inference is non-portable for declaration emit.
export function createHosannaAuthClient(options: CreateHosannaAuthClientOptions): any {
  const baseURL = options.baseURL.replace(/\/+$/, "");
  const twoFactorPage = options.twoFactorPage ?? `${baseURL}/two-factor`;

  return createAuthClient({
    baseURL,
    fetchOptions: {
      credentials: "include",
      ...options.fetchOptions,
    },
    plugins: [
      i18nClient(),
      dashClient(),
      sentinelClient({
        autoSolveChallenge: true,
        ...(options.identifyUrl ? { identifyUrl: options.identifyUrl } : {}),
      }),
      inboxClient(),
      twoFactorClient({
        twoFactorPage,
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

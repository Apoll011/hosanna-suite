/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18nClient } from "@better-auth/i18n/client";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/client";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { inboxClient } from "better-inbox/client";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}`
    : window.location.origin,
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
      twoFactorPage: "/two-factor",
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

export type { Session, User } from "better-auth";

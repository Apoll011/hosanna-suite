/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHosannaAuthClient } from "@hosanna/auth/client";
import { getAuthAppUrl } from "./authUrl";

const authBase =
  import.meta.env.VITE_AUTH_URL ||
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}`
    : typeof window !== "undefined"
      ? window.location.origin
      : getAuthAppUrl());

/**
 * Studio talks to the auth app's Better Auth host.
 * 2FA redirects default to `{baseURL}/two-factor` on that host.
 */
export const authClient = createHosannaAuthClient({
  baseURL: String(authBase).replace(/\/+$/, ""),
});

export type { Session, User } from "better-auth";

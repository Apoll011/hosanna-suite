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

export const authClient = createHosannaAuthClient({
  baseURL: String(authBase).replace(/\/+$/, ""),
  twoFactorPage: `${getAuthAppUrl()}/two-factor`,
});

export type { Session, User } from "better-auth";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHosannaAuthClient } from "@hosanna/auth/client";
import { getAuthAppUrl } from "./authUrl";

/**
 * Studio Better Auth client — always targets the auth app host.
 * getSession / organization.* / subscription.* / 2FA all go here, never the API.
 */
export const authClient = createHosannaAuthClient({
  baseURL: getAuthAppUrl(),
});

export type { Session, User } from "better-auth";

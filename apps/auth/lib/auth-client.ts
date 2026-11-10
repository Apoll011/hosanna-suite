"use client";

import { createHosannaAuthClient } from "@hosanna/auth/client";

const baseURL =
  process.env.NEXT_PUBLIC_AUTH_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");

/** Browser auth client — 2FA page defaults to `{baseURL}/two-factor`. */
export const authClient = createHosannaAuthClient({ baseURL });

export type { Session, User } from "better-auth";

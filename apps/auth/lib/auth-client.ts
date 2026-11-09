"use client";

import { createHosannaAuthClient } from "@hosanna/auth/client";

const baseURL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AUTH_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");

export const authClient = createHosannaAuthClient({
  baseURL,
  twoFactorPage: "/two-factor",
});

export type { Session, User } from "better-auth";

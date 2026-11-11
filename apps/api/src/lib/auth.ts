import { createAuth } from "@hosanna/auth/server";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";

/**
 * Slim Better Auth resource server (shared DB/Redis with the auth app).
 * getSession + inbox notify + JWKS — no Stripe / Google / Turnstile / mail.
 *
 * `baseURL` / issuer MUST be the auth app origin (`env.authIssuer`).
 */
export const auth = createAuth({
  mode: "slim",
  prisma,
  config: {
    betterAuthSecret: env.betterAuthSecret,
    publicAppUrl: env.authIssuer,
    redisUrl: env.redisUrl,
  },
});

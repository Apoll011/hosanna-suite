/**
 * Auth-app environment. Mirrors auth-related vars from `@hosanna/api`
 * plus `AUTH_URL` (this app's public origin).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Allow `next build` / CI typecheck without a full .env; runtime still needs real values.
    if (
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return `missing-${name}`;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

/** Better Auth MCP rejects http:// for non-loopback hosts (fails `next build`). */
function normalizeMcpResourceUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!isLoopback && parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const isVercel = Boolean(process.env.VERCEL);

/** Auth app origin — AUTH_URL, else PUBLIC_APP_URL, else local Next port. */
const authUrl = process.env.AUTH_URL ?? process.env.PUBLIC_APP_URL ?? "http://localhost:5174";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isVercel,

  databaseUrl: required("DATABASE_URL"),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX ?? (isVercel ? "5" : "20"), 10),

  /** Same Redis as the API — Better Auth secondary storage + shared caches. */
  redisUrl: optional("REDIS_URL"),

  betterAuthSecret: required("BETTER_AUTH_SECRET"),
  /** Better Auth baseURL / issuer — must be this auth app origin. */
  publicAppUrl: authUrl,
  betterAuthApiKey: optional("BETTER_AUTH_API_KEY"),

  authUrl,
  studioUrl: process.env.STUDIO_URL ?? "https://studio.hosanna.live",

  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),

  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),

  turnstileSecretKey: required("TURNSTILE_SECRET_KEY"),
  turnstileSiteKey: optional("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),

  supabaseUrl: required("SUPABASE_URL"),
  supabaseSecretKey: required("SUPABASE_SECRET_KEY"),

  resendApiKey: required("RESEND_API_KEY"),
  emailFrom: process.env.EMAIL_FROM ?? "Hosanna <no-reply@hosanna.live>",

  /**
   * MCP resource identifier (stays on the API host).
   * Better Auth MCP requires https for non-loopback hosts.
   */
  mcpResourceUrl: normalizeMcpResourceUrl(
    optional("MCP_RESOURCE_URL") ??
      (process.env.NODE_ENV === "production"
        ? "https://api.hosanna.live/mcp"
        : "http://localhost:3000/mcp"),
  ),
};

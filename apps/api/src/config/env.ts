import { withRelatedProject } from "@vercel/related-projects";
import "dotenv/config";

/** Vercel project name for `apps/auth` (see apps/auth/.vercel/project.json). */
const AUTH_RELATED_PROJECT_NAME = "hosanna-auth";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

/** Force https for non-loopback AUTH_URL so Better Auth issuer matches the auth app. */
function normalizeAuthUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!loopback && parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url.replace(/\/+$/, "");
  }
}

/**
 * Auth app origin (Better Auth baseURL / issuer + deep links).
 * Uses `@vercel/related-projects` so preview API matches the hosanna-auth deploy;
 * falls back to AUTH_URL (then PUBLIC_APP_URL).
 */
function resolveAuthUrl(): string {
  const fallback = optional("AUTH_URL") ?? optional("PUBLIC_APP_URL");
  if (!fallback) {
    throw new Error("Missing required environment variable: AUTH_URL (or PUBLIC_APP_URL)");
  }
  return (
    normalizeAuthUrl(
      withRelatedProject({
        projectName: AUTH_RELATED_PROJECT_NAME,
        defaultHost: fallback,
      }),
    ) ?? fallback.replace(/\/+$/, "")
  );
}

/** True when running inside a Vercel Function. */
const isVercel = Boolean(process.env.VERCEL);

/** Auth app origin — Better Auth issuer / deep links. */
const authUrl = resolveAuthUrl();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000", 10),
  /** Legacy local flag; cookie SameSite is always `none`+`secure` for cross-origin Studio↔API. */
  devMode: process.env.DEV_MODE === "true",
  /** Vercel Fluid / serverless runtime. */
  isVercel,
  /**
   * Extra CORS origins (comma-separated). Merged with the built-in allowlist
   * (Studio, localhost, MCP hosts, *.hosanna.live).
   */
  corsOriginExtra: (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /**
   * Global + route rate limits. On by default outside development.
   * Set RATE_LIMIT_DISABLED=true to turn off (e.g. local load tests).
   */
  rateLimitDisabled:
    process.env.RATE_LIMIT_DISABLED === "true" ||
    (process.env.NODE_ENV ?? "development") === "development",

  databaseUrl: required("DATABASE_URL"),
  /**
   * Max connections in the pg pool.
   * Defaults to 5 on Vercel (many warm isolates × large pools exhaust Postgres)
   * and 20 for long-running hosts (Docker / local).
   */
  dbPoolMax: parseInt(process.env.DB_POOL_MAX ?? (isVercel ? "5" : "20"), 10),

  publicAppUrl: required("PUBLIC_APP_URL"),

  /** Same Redis as the auth app — Better Auth secondary storage + `@hosanna/cache`. */
  redisUrl: optional("REDIS_URL"),

  /** Shared with the auth app — cookie/JWE session validation. */
  betterAuthSecret: required("BETTER_AUTH_SECRET"),

  /**
   * Auth app origin — Better Auth issuer / deep links.
   * `withRelatedProject` → matching hosanna-auth deploy; else AUTH_URL.
   */
  authUrl,
  /** createAuth slim `baseURL` / public issuer (same as authUrl). */
  authIssuer: authUrl,

  cronSecret: optional("CRON_SECRET"),

  fcmProjectId: optional("FCM_PROJECT_ID"),
  fcmClientEmail: optional("FCM_CLIENT_EMAIL"),
  /** Service-account private key with literal \n escapes (as in the JSON file). */
  fcmPrivateKey: optional("FCM_PRIVATE_KEY"),

  /**
   * AES-256-GCM key for encrypting per-org LLM API keys at rest.
   * Prefer 64 hex characters (32 bytes). Required to save/use org AI keys.
   */
  aiSettingsEncryptionKey: optional("AI_SETTINGS_ENCRYPTION_KEY"),

  /**
   * Public URL of this API's MCP endpoint (RFC 9728 resource identifier).
   * Loopback HTTP is OK for local; production should be https://.../mcp.
   */
  mcpResourceUrl:
    optional("MCP_RESOURCE_URL") ??
    `http://127.0.0.1:${parseInt(process.env.PORT ?? "3000", 10)}/mcp`,

  /** YouTube Data API v3 key — improves `{youtube:}` lookups. */
  youtubeApiKey: optional("YOUTUBE_API_KEY"),
};
/** Reject loopback MCP resource URLs outside local/dev — breaks Claude/ChatGPT OAuth audience. */
function assertMcpResourceUrlForRuntime(): void {
  const url = env.mcpResourceUrl;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`MCP_RESOURCE_URL is not a valid URL: ${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const isProd = env.nodeEnv === "production" || Boolean(process.env.VERCEL);
  if (isProd && (isLoopback || parsed.protocol !== "https:")) {
    throw new Error(
      `MCP_RESOURCE_URL must be a public https://…/mcp URL in production (got ${url}). ` +
        `Set it to the exact URL MCP clients use (e.g. https://dev-api.hosanna.live/mcp).`,
    );
  }
  if (parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error(
      `MCP_RESOURCE_URL must not include credentials, query, or fragment (got ${url}).`,
    );
  }
}

assertMcpResourceUrlForRuntime();

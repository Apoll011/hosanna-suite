/**
 * Preload for `tsx --test`: load local `.env` when present, then fill any
 * required `env.ts` keys so unit tests can import MCP/auth modules in CI
 * without a real secrets file.
 *
 * Wire with: `tsx --import ./test/setup-env.ts --test ...`
 */
import "dotenv/config";

const defaults: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/hosanna_test",
  BETTER_AUTH_SECRET: "test-better-auth-secret-at-least-32-chars",
  PUBLIC_APP_URL: "http://127.0.0.1:3000",
  // Keep Better Auth mounted on the API during unit tests.
  AUTH_MOUNT: "local",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  STRIPE_SECRET_KEY: "sk_test_ci_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_test_ci_placeholder",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "test-supabase-secret-key",
  RESEND_API_KEY: "re_test_ci_placeholder",
  AI_SETTINGS_ENCRYPTION_KEY: "a".repeat(64),
  NODE_ENV: "test",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

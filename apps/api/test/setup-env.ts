/**
 * Preload for `tsx --test`: load local `.env` when present, then fill any
 * required `env.ts` keys so unit tests can import modules in CI.
 *
 * Wire with: `tsx --import ./test/setup-env.ts --test ...`
 */
import "dotenv/config";

const defaults: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/hosanna_test",
  PUBLIC_APP_URL: "http://127.0.0.1:3000",
  AUTH_URL: "http://127.0.0.1:5174",
  BETTER_AUTH_SECRET: "test-better-auth-secret-min-32-chars!!",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_test_placeholder",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  AI_SETTINGS_ENCRYPTION_KEY: "a".repeat(64),
  NODE_ENV: "test",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

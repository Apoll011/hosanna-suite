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
  AI_SETTINGS_ENCRYPTION_KEY: "a".repeat(64),
  NODE_ENV: "test",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

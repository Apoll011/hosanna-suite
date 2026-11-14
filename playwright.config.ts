import { defineConfig, devices } from "@playwright/test";

import { AUTH_URL, SAAS_URL, STUDIO_URL } from "./tests/helpers/urls";

const isCI = !!process.env.CI;

/**
 * Hosanna suite e2e — saas (marketing), auth (Next), studio (Vite).
 * Projects isolate baseURL; webServer starts all three apps locally.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    locale: "en-US",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "saas",
      testMatch: /saas\/.*\.spec\.ts/,
      testIgnore: /saas\/mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: SAAS_URL },
    },
    {
      name: "saas-mobile",
      testMatch: /saas\/mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: SAAS_URL },
    },
    {
      name: "auth",
      testMatch: /auth\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: AUTH_URL },
    },
    {
      name: "studio",
      testMatch: /studio\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: STUDIO_URL },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @hosanna/saas exec vite --host 127.0.0.1 --port 8080",
      url: SAAS_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_DASHBOARD_URL: AUTH_URL,
      },
    },
    {
      command: "pnpm --filter @hosanna/auth-app dev",
      url: AUTH_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
    {
      command: "pnpm --filter @hosanna/studio exec vite --host 127.0.0.1 --port 5173",
      url: STUDIO_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_AUTH_URL: AUTH_URL,
      },
    },
  ],
});

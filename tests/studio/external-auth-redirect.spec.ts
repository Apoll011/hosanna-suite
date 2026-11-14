import { expect, test } from "@playwright/test";

import { isAuthAppUrl, isStudioUrl } from "../helpers/urls";

const LEGACY_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/new",
  "/onboarding",
  "/auth/error",
] as const;

test.describe("Studio external auth redirects", () => {
  for (const path of LEGACY_PATHS) {
    test(`legacy ${path} leaves studio for the auth app`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL((url) => !isStudioUrl(url) && isAuthAppUrl(url), {
        timeout: 30_000,
      });
      expect(isAuthAppUrl(new URL(page.url()))).toBe(true);
    });
  }
});

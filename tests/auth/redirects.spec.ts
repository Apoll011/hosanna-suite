import { expect, test } from "@playwright/test";

test.describe("Auth redirects", () => {
  test.beforeEach(async ({ context }) => {
    // Guest assertions must not reuse a local browser session from prior manual use.
    await context.clearCookies();
  });

  test("root sends guests to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
  });

  test("login document title uses auth template", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Login.*Hosanna Auth/i);
  });

  test("home is not publicly accessible without a completed session", async ({ page }) => {
    await page.goto("/home");
    // Guests → /login; authenticated users without a workspace → /onboarding.
    await expect(page).toHaveURL(/\/(login|onboarding)/, { timeout: 20_000 });
  });

  test("account redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});

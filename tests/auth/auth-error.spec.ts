import { expect, test } from "@playwright/test";

test.describe("Auth error page", () => {
  test("renders generic auth error", async ({ page }) => {
    await page.goto("/auth/error");
    await expect(page.getByRole("heading", { name: /Authentication error/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Back to sign in/i })).toBeVisible();
  });

  test("surfaces error query param", async ({ page }) => {
    await page.goto("/auth/error?error=access_denied");
    await expect(page.getByText(/Access denied/i)).toBeVisible();
  });

  test("back to sign in goes to login", async ({ page }) => {
    await page.goto("/auth/error");
    await page.getByRole("button", { name: /Back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

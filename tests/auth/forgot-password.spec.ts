import { expect, test } from "@playwright/test";

test.describe("Auth forgot password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders reset password UI", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Reset password/i })).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to sign in/i })).toBeVisible();
  });

  test("supports email link and OTP modes", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Email link/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^OTP$/i })).toBeVisible();
    await page.getByRole("button", { name: /^OTP$/i }).click();
    await page.getByRole("button", { name: /Email link/i }).click();
  });

  test("empty email shows validation error", async ({ page }) => {
    await page.getByRole("button", { name: /Send link/i }).click();
    await expect(page.getByText(/Enter a valid email address/i)).toBeVisible();
  });

  test("back to sign in returns to login", async ({ page }) => {
    await page.getByRole("link", { name: /Back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

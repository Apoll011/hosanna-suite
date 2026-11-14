import { expect, test } from "@playwright/test";

test.describe("Auth reset password", () => {
  test("without token shows invalid/expired state", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /Invalid or expired link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Send link/i }).first()).toBeVisible();
  });

  test("with token shows new password form", async ({ page }) => {
    await page.goto("/reset-password?token=test-token");
    await expect(page.getByRole("heading", { name: /Choose a new password/i })).toBeVisible();
    await expect(page.getByLabel(/New password/i)).toBeVisible();
    await expect(page.getByLabel(/Confirm password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset password/i })).toBeVisible();
  });

  test("with token rejects short password", async ({ page }) => {
    await page.goto("/reset-password?token=test-token");
    await page.getByLabel(/New password/i).fill("12345");
    await page.getByLabel(/Confirm password/i).fill("12345");
    await page.getByRole("button", { name: /Reset password/i }).click();
    await expect(page.getByText(/Password must be at least 6 characters/i)).toBeVisible();
  });

  test("with token rejects mismatched passwords", async ({ page }) => {
    await page.goto("/reset-password?token=test-token");
    await page.getByLabel(/New password/i).fill("password1");
    await page.getByLabel(/Confirm password/i).fill("password2");
    await page.getByRole("button", { name: /Reset password/i }).click();
    await expect(page.getByText(/Passwords do not match/i).first()).toBeVisible();
  });
});

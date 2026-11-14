import { expect, test } from "@playwright/test";

test.describe("Auth register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders create-account form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
    await expect(page.getByLabel(/^Name$/i)).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    await expect(page.getByLabel(/Confirm password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create account/i })).toBeVisible();
  });

  test("empty submit asks to fill all fields", async ({ page }) => {
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page.getByText(/Please fill in all fields/i)).toBeVisible();
  });

  test("password mismatch is rejected", async ({ page }) => {
    await page.getByLabel(/^Name$/i).fill("Ada Lovelace");
    await page.getByLabel(/^Email$/i).fill("ada@example.com");
    await page.getByLabel(/^Password$/i).fill("password1");
    await page.getByLabel(/Confirm password/i).fill("password2");
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page.getByText(/Passwords do not match/i).first()).toBeVisible();
  });

  test("short password is rejected", async ({ page }) => {
    await page.getByLabel(/^Name$/i).fill("Ada Lovelace");
    await page.getByLabel(/^Email$/i).fill("ada@example.com");
    await page.getByLabel(/^Password$/i).fill("12345");
    await page.getByLabel(/Confirm password/i).fill("12345");
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page.getByText(/Password must be at least 6 characters/i)).toBeVisible();
  });

  test("sign-in link returns to login", async ({ page }) => {
    await page.getByRole("link", { name: /Already have an account\? Sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

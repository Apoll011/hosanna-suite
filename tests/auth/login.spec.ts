import { expect, test } from "@playwright/test";

test.describe("Auth login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders sign-in form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Remember me/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sign in$/i })).toBeVisible();
  });

  test("links to register and forgot password", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Create account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
  });

  test("shows Google continue option", async ({ page }) => {
    await expect(page.getByText(/or continue with/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("empty submit shows invalid credentials message", async ({ page }) => {
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    const password = page.getByLabel(/^Password$/i);
    await password.fill("secret-pass");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: /Show password/i }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: /Hide password/i }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("Create account navigates to register", async ({ page }) => {
    await page.getByRole("link", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
  });

  test("Forgot password navigates to recovery", async ({ page }) => {
    await page.getByRole("link", { name: /Forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole("heading", { name: /Reset password/i })).toBeVisible();
  });
});

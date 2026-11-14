import { expect, test } from "@playwright/test";

test.describe("Auth 404", () => {
  test("unknown path shows page not found", async ({ page }) => {
    await page.goto("/definitely-missing-auth-route");
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("button", { name: /Go to sign in/i })).toBeVisible();
  });

  test("go to sign in reaches login", async ({ page }) => {
    await page.goto("/nope");
    await page.getByRole("link", { name: /Go to sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});


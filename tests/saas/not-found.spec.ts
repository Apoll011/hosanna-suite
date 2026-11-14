import { expect, test } from "@playwright/test";

test.describe("SaaS 404", () => {
  test("unknown path shows not found and home link", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Page Not Found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Home$/i })).toBeVisible();
  });

  test("Home link returns to landing", async ({ page }) => {
    await page.goto("/missing-page");
    await page.getByRole("link", { name: /^Home$/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle(/Music Songbook App for Live Worship/i);
  });
});

import { expect, test } from "@playwright/test";

test.describe("SaaS mobile", () => {
  test("opens mobile menu and navigates to contact", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Menu/i }).click();
    await page.getByRole("banner").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
  });

  test("mobile menu exposes Try for Free", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Menu/i }).click();
    const tryFree = page.getByRole("link", { name: /Try for Free/i }).first();
    await expect(tryFree).toBeVisible();
    await expect(tryFree).toHaveAttribute("href", /\/new$/);
  });
});

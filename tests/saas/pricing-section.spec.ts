import { expect, test } from "@playwright/test";

test.describe("SaaS pricing section", () => {
  test("home pricing section is reachable via hash", async ({ page }) => {
    await page.goto("/#pricing");
    await expect(
      page.getByText(/investment in your worship|Pricing|preço|precio/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/14-day free trial|14 dias|14 días/i).first()).toBeVisible();
  });

  test("pricing CTA points to auth signup", async ({ page }) => {
    await page.goto("/#pricing");
    const tryFree = page.getByRole("link", { name: /Try for Free/i }).first();
    await expect(tryFree).toHaveAttribute("href", /\/new/);
  });
});

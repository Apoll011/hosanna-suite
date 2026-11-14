import { expect, test } from "@playwright/test";

import { DEMO_ORG_SLUG } from "../helpers/urls";

test.describe("Studio demo mode", () => {
  test("boots demo and lands on folders", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText(/Starting demo/i)).toBeVisible();
    await page.waitForURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`), { timeout: 60_000 });
    await expect(page.locator('[data-tour="sidebar"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-tour="nav-library"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-services"]')).toBeVisible();
  });

  test("demo sidebar exposes primary sections", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`), { timeout: 60_000 });
    // Prefer stable data-tour hooks; labels vary by demo org locale (pt/en/es).
    await expect(page.locator('[data-tour="nav-library"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-collections"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-services"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-agenda"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-drive"]')).toBeVisible();
  });
});

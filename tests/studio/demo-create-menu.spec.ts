import { expect, test } from "@playwright/test";

import { DEMO_ORG_SLUG } from "../helpers/urls";

test.describe("Studio demo create menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`), { timeout: 60_000 });
    await expect(page.locator('[data-tour="toolbar-create"]')).toBeVisible({ timeout: 30_000 });
  });

  test("lists create actions", async ({ page }) => {
    await page.locator('[data-tour="toolbar-create"]').click();
    const menu = page.locator('[data-tour="create-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.getByText(/Song|Cântico|Cántico|Canción|Música/i).first()).toBeVisible();
    await expect(menu.getByText(/Folder|Pasta|Carpeta/i).first()).toBeVisible();
  });
});

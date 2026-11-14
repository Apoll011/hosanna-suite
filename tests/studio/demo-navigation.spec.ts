import { expect, test } from "@playwright/test";

import { DEMO_ORG_SLUG } from "../helpers/urls";

test.describe("Studio demo navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`), { timeout: 60_000 });
    await expect(page.locator('[data-tour="sidebar"]')).toBeVisible({ timeout: 30_000 });
  });

  test("opens library (songs)", async ({ page }) => {
    await page.locator('[data-tour="nav-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/songs`));
  });

  test("opens collections", async ({ page }) => {
    await page.locator('[data-tour="nav-collections"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/collections`));
  });

  test("opens services", async ({ page }) => {
    await page.locator('[data-tour="nav-services"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/services`));
  });

  test("opens agenda", async ({ page }) => {
    await page.locator('[data-tour="nav-agenda"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/agenda`));
  });

  test("drive nav returns to folders", async ({ page }) => {
    await page.locator('[data-tour="nav-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/songs`));
    await page.locator('[data-tour="nav-drive"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`));
  });

  test("create menu is available on folders", async ({ page }) => {
    await expect(page.locator('[data-tour="toolbar-create"]')).toBeVisible();
    await page.locator('[data-tour="toolbar-create"]').click();
    await expect(page.locator('[data-tour="create-menu"]')).toBeVisible();
  });

  test("search toolbar is present", async ({ page }) => {
    await expect(page.locator('[data-tour="toolbar-search"]')).toBeVisible();
  });

  test("user menu opens", async ({ page }) => {
    await page.locator('[data-tour="nav-user-menu"]').click();
    await expect(
      page.getByText(/Settings|Definições|Configuración|Account|Conta|Cuenta|Analytics|Análises/i).first(),
    ).toBeVisible();
  });
});

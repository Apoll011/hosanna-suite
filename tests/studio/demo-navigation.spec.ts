import { expect, test } from "@playwright/test";

import { DEMO_ORG_SLUG } from "../helpers/urls";

test.describe("Studio demo navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`), { timeout: 60_000 });
    await expect(page.locator('[data-tour="sidebar"], [data-testid="sidebar"]')).toBeVisible({
      timeout: 30_000,
    });
  });

  test("opens library (songs)", async ({ page }) => {
    await page.locator('[data-tour="nav-library"], [data-testid="nav-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/songs`));
  });

  test("opens collections", async ({ page }) => {
    await page.locator('[data-tour="nav-collections"], [data-testid="nav-collections"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/collections`));
  });

  test("opens services", async ({ page }) => {
    await page.locator('[data-tour="nav-services"], [data-testid="nav-services"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/services`));
  });

  test("opens agenda", async ({ page }) => {
    await page.locator('[data-tour="nav-agenda"], [data-testid="nav-agenda"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/agenda`));
  });

  test("drive nav returns to folders", async ({ page }) => {
    await page.locator('[data-tour="nav-library"], [data-testid="nav-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/songs`));
    await page.locator('[data-tour="nav-drive"], [data-testid="nav-drive"]').click();
    await expect(page).toHaveURL(new RegExp(`/${DEMO_ORG_SLUG}/folders`));
  });

  test("create menu is available on folders", async ({ page }) => {
    await expect(
      page.locator('[data-tour="toolbar-create"], [data-testid="toolbar-create"]'),
    ).toBeVisible();
    await page.locator('[data-tour="toolbar-create"], [data-testid="toolbar-create"]').click();
    await expect(
      page.locator('[data-tour="create-menu"], [data-testid="create-menu"]'),
    ).toBeVisible();
  });

  test("search toolbar is present", async ({ page }) => {
    await expect(
      page.locator('[data-tour="toolbar-search"], [data-testid="toolbar-search"]'),
    ).toBeVisible();
  });

  test("user menu opens", async ({ page }) => {
    await page
      .locator('[data-tour="nav-user-menu"] button, [data-testid="nav-user-menu"] button')
      .first()
      .click();
    await expect(
      page
        .getByRole("menu")
        .getByText(/Settings|Definições|Configuración|Analytics|Análises/i)
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("menu").getByText(/^(Account|Conta|Cuenta)$/i),
    ).toHaveCount(0);
    await expect(
      page.getByRole("menu").getByText(/^(Organization|Organização|Organización)$/i),
    ).toHaveCount(0);
  });
});

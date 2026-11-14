import { expect, test } from "@playwright/test";

test.describe("SaaS navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("desktop nav exposes primary links", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "ChordPro" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pricing" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  test("ChordPro nav goes to guide page", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "ChordPro" }).click();
    await expect(page).toHaveURL(/\/chordpro$/);
    await expect(page).toHaveTitle(/ChordPro Guide/i);
  });

  test("About nav goes to about page", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page).toHaveTitle(/About.*Hosanna/i);
  });

  test("Contact nav goes to contact page", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page).toHaveTitle(/Contact.*Hosanna/i);
  });

  test("Features hash link stays on home", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Features" }).click();
    await expect(page).toHaveURL(/\/#features$/);
  });

  test("Pricing hash link stays on home", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/\/#pricing$/);
  });

  test("logo returns to home from about", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("img", { name: "Hosanna Studio" }).first().click();
    await expect(page).toHaveURL(/\/(#top)?$/);
  });
});

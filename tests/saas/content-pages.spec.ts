import { expect, test } from "@playwright/test";

test.describe("SaaS content pages", () => {
  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About.*Hosanna/i);
    await expect(page.getByRole("img", { name: "Hosanna Studio" }).first()).toBeVisible();
  });

  test("chordpro guide page renders", async ({ page }) => {
    await page.goto("/chordpro");
    await expect(page).toHaveTitle(/ChordPro Guide/i);
    await expect(page.getByText(/ChordPro/i).first()).toBeVisible();
  });

  test("privacy policy page renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy Policy/i);
    await expect(page.getByText(/Privacy/i).first()).toBeVisible();
  });

  test("terms of service page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveTitle(/Terms of Service/i);
    await expect(page.getByText(/Terms/i).first()).toBeVisible();
  });

  test("footer legal links reach privacy and terms", async ({ page }) => {
    await page.goto("/");
    const privacy = page.getByRole("link", { name: /Privacy Policy/i }).first();
    await expect(privacy).toBeVisible();
    await privacy.click();
    await expect(page).toHaveURL(/\/privacy$/);

    await page.goto("/");
    const terms = page.getByRole("link", { name: /Terms of Service/i }).first();
    await expect(terms).toBeVisible();
    await terms.click();
    await expect(page).toHaveURL(/\/terms$/);
  });

  test("client navigation updates document title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Music Songbook App for Live Worship/i);
    await page.getByRole("navigation").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveTitle(/Contact \| Hosanna/i);
    await page.getByRole("navigation").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveTitle(/About \| Hosanna/i);
  });
});

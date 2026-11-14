import { expect, test } from "@playwright/test";

test.describe("SaaS home", () => {
  test("loads with marketing title and brand logo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Hosanna.*Music Songbook/i);
    await expect(page.getByRole("img", { name: "Hosanna Studio" }).first()).toBeVisible();
  });

  test("hero shows primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get Started/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Watch Demo/i }).first()).toBeVisible();
  });

  test("Get Started points at auth /new", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /Get Started/i }).first();
    await expect(cta).toHaveAttribute("href", /\/new$/);
  });

  test("Try for Free CTA points at auth /new", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /Try for Free/i }).first();
    await expect(cta).toHaveAttribute("href", /\/new$/);
  });

  test("Watch Demo anchors to #how", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Watch Demo/i }).first()).toHaveAttribute(
      "href",
      "#how",
    );
  });

  test("hero mentions ChordPro / worship", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/ChordPro|worship|songbook/i).first()).toBeVisible();
  });
});

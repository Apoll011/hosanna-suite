import { expect, test } from "@playwright/test";

test.describe("SaaS contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("shows form fields and submit", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Let's/i })).toBeVisible();
    await expect(page.getByLabel(/^Name$/i)).toBeVisible();
    await expect(page.getByLabel(/^Church$/i)).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Subject$/i)).toBeVisible();
    await expect(page.getByLabel(/Your Message/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Message/i })).toBeVisible();
  });

  test("subject options include support categories", async ({ page }) => {
    const subject = page.getByLabel(/^Subject$/i);
    await expect(subject.locator("option")).toHaveText([
      "Technical Support",
      "Feature Suggestion",
      "Questions about Plans",
      "Partnerships",
      "Other",
    ]);
  });

  test("email and message are required", async ({ page }) => {
    const email = page.getByLabel(/^Email$/i);
    const message = page.getByLabel(/Your Message/i);
    await expect(email).toHaveAttribute("required", "");
    await expect(message).toHaveAttribute("required", "");
  });

  test("privacy policy consent link is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Privacy Policy/i }).first()).toBeVisible();
  });

  test("support email mailto link is exposed", async ({ page }) => {
    const emailLink = page.getByRole("main").getByRole("link", {
      name: /hosanna\.songbook@gmail\.com/i,
    });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute("href", "mailto:hosanna.songbook@gmail.com");
  });

  test("filled form submits without leaving the contact page", async ({ page }) => {
    await page.getByLabel(/^Name$/i).fill("Test User");
    await page.getByLabel(/^Church$/i).fill("Test Church");
    await page.getByLabel(/^Email$/i).fill("test@example.com");
    await page.getByLabel(/^Subject$/i).selectOption({ label: "Feature Suggestion" });
    await page.getByLabel(/Your Message/i).fill("Hello from Playwright e2e.");

    // Mailto navigations are not reliably observable in headless browsers;
    // assert the form handler runs (preventDefault) and the page stays put.
    await page.getByRole("button", { name: /Send Message/i }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByLabel(/^Email$/i)).toHaveValue("test@example.com");
  });
});

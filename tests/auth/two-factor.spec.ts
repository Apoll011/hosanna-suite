import { expect, test } from "@playwright/test";

test.describe("Auth two-factor", () => {
  test("renders 2FA challenge UI", async ({ page }) => {
    await page.goto("/two-factor");
    await expect(page.getByRole("heading", { name: /Two-factor authentication/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Verify$/i })).toBeVisible();
  });

  test("offers app, email, and backup methods", async ({ page }) => {
    await page.goto("/two-factor");
    await expect(page.getByRole("button", { name: /^App$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Email$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Backup code/i })).toBeVisible();
    await page.getByRole("button", { name: /Backup code/i }).click();
    await expect(page.getByText(/Enter a backup recovery code/i)).toBeVisible();
    await expect(page.getByLabel(/Backup code/i)).toBeVisible();
  });
});


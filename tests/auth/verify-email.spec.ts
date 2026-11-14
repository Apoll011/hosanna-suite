import { expect, test } from "@playwright/test";

test.describe("Auth verify email", () => {
  test("renders verify email page", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByRole("heading", { name: /Verify email/i })).toBeVisible();
  });
});

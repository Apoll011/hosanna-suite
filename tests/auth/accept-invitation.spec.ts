import { expect, test } from "@playwright/test";

test.describe("Auth accept invitation", () => {
  test("shows invitation UI or invalid state without token", async ({ page }) => {
    await page.goto("/accept-invitation");
    await expect(
      page.getByRole("heading", { name: /Workspace invitation|Invalid or expired link/i }),
    ).toBeVisible();
  });
});

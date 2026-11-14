import { expect, test } from "@playwright/test";

test.describe("Auth new organization (/new)", () => {
  test("renders workspace creation step", async ({ page }) => {
    await page.goto("/new");
    await expect(page.getByRole("heading", { name: /Create workspace/i })).toBeVisible();
    await expect(page.getByLabel(/Workspace name/i)).toBeVisible();
    await expect(page.getByLabel(/URL slug/i)).toBeVisible();
  });

  test("links back to sign in", async ({ page }) => {
    await page.goto("/new");
    await expect(page.getByRole("link", { name: /Already have an account\? Sign in/i })).toBeVisible();
  });

  test("continue stays disabled until workspace fields are valid", async ({ page }) => {
    await page.goto("/new");
    const continueBtn = page.getByRole("button", { name: /Continue/i });
    await expect(continueBtn).toBeDisabled();
    await page.getByLabel(/Workspace name/i).fill("E2E Church");
    await page.getByLabel(/URL slug/i).fill("e2e-church-playwright");
    await expect(
      page.getByText(/Checking availability|Slug is available|already taken/i),
    ).toBeVisible({ timeout: 20_000 });
  });
});


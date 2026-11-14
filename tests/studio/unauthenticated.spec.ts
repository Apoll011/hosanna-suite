import { expect, test } from "@playwright/test";

import { isAuthAppUrl, isStudioUrl } from "../helpers/urls";

test.describe("Studio unauthenticated", () => {
  test("root redirects to auth login with returnUrl", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL((url) => !isStudioUrl(url) && isAuthAppUrl(url), {
      timeout: 30_000,
    });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("returnUrl=");
  });

  test("protected org path redirects to auth login", async ({ page }) => {
    await page.goto("/some-org/folders");
    await page.waitForURL((url) => !isStudioUrl(url) && isAuthAppUrl(url), {
      timeout: 30_000,
    });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("returnUrl=");
  });
});

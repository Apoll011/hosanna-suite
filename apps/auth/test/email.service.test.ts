// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SKIP_ENV_VALIDATION ??= "true";

const { getRegisteredTemplates, hasTemplate, registerEmailTemplate, renderEmailTemplate } =
  await import("../lib/services/email");

describe("email.service templates (no network)", () => {
  it("reports known built-in templates", () => {
    assert.equal(hasTemplate("welcome"), true);
    assert.equal(hasTemplate("verify-email"), true);
    assert.equal(hasTemplate("2fa-code"), true);
    assert.equal(hasTemplate("deletion-otp"), true);
    assert.equal(hasTemplate("org-deletion-otp"), true);
    assert.equal(hasTemplate("org-deleted"), true);
    assert.equal(hasTemplate("does-not-exist"), false);

    const registered = getRegisteredTemplates();
    assert.ok(registered.includes("welcome"));
    assert.ok(registered.includes("forgot-password"));
    assert.ok(registered.includes("deletion-otp"));
    assert.ok(registered.includes("org-deletion-otp"));
    assert.ok(registered.includes("org-deleted"));
  });

  it("renders the deletion OTP and org deleted templates", () => {
    const accountOtpHtml = renderEmailTemplate("deletion-otp", {
      otp: "123456",
      expireMinutes: 10,
    });
    assert.ok(accountOtpHtml.includes("123456"));

    const orgOtpHtml = renderEmailTemplate("org-deletion-otp", {
      otp: "654321",
      churchName: "Grace Church",
      expireMinutes: 10,
    });
    assert.ok(orgOtpHtml.includes("654321"));
    assert.ok(orgOtpHtml.includes("Grace Church"));

    const orgDeletedHtml = renderEmailTemplate("org-deleted", {
      firstName: "Ada",
      churchName: "Grace Church",
    });
    assert.ok(orgDeletedHtml.includes("Grace Church"));
  });

  it("renders the welcome template with variables", () => {
    const html = renderEmailTemplate("welcome", {
      firstName: "Ada",
      dashboardUrl: "https://studio.hosanna.live/grace",
    });
    assert.ok(html.includes("Hosanna"));
    assert.ok(html.includes("https://studio.hosanna.live/grace"));
    assert.ok(html.includes("<!DOCTYPE html>") || html.includes("<html"));
  });

  it("registers and renders a custom template without layout wrap", () => {
    const name = `test-custom-${Date.now()}`;
    registerEmailTemplate(name, `<p>Hello {{first_name}}</p>`, {
      wrapWithLayout: false,
      defaultSubject: "Hi",
    });
    assert.equal(hasTemplate(name), true);
    const html = renderEmailTemplate(name, { first_name: "Ada" });
    assert.equal(html.trim(), "<p>Hello Ada</p>");
  });
});

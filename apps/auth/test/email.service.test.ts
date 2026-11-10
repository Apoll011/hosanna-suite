import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SKIP_ENV_VALIDATION ??= "true";

const {
  getRegisteredTemplates,
  hasTemplate,
  registerEmailTemplate,
  renderEmailTemplate,
} = await import("../lib/email.service.ts");

describe("email.service templates (no network)", () => {
  it("reports known built-in templates", () => {
    assert.equal(hasTemplate("welcome"), true);
    assert.equal(hasTemplate("verify-email"), true);
    assert.equal(hasTemplate("2fa-code"), true);
    assert.equal(hasTemplate("does-not-exist"), false);

    const registered = getRegisteredTemplates();
    assert.ok(registered.includes("welcome"));
    assert.ok(registered.includes("forgot-password"));
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

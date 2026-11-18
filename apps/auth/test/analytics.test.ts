import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  authAnalytics,
  captureException,
  identify,
  reset,
  track,
  trackPageview,
} from "../lib/analytics/index";

describe("auth analytics", () => {
  it("initializes with auth app name", () => {
    assert.equal(authAnalytics.appName, "auth");
    assert.equal(typeof authAnalytics.track, "function");
    assert.equal(typeof authAnalytics.captureException, "function");
    assert.equal(typeof authAnalytics.identify, "function");
    assert.equal(typeof authAnalytics.reset, "function");
  });

  it("handles tracking calls safely without throwing when unconfigured", () => {
    assert.doesNotThrow(() => {
      track("auth_login_attempted", { provider: "email", email: "test@example.com" });
      track("auth_login_succeeded", { provider: "email" });
      track("auth_login_failed", { provider: "email", reason: "invalid credentials" });
      track("auth_logout", {});
      trackPageview("/login");
      identify("user_123", { email: "test@example.com" });
      reset();
      captureException(new Error("auth test error"));
    });
  });
});

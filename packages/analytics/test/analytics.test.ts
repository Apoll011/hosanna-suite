import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTH_EVENT_NAMES,
  POSTHOG_EVENT_NAMES,
  POSTHOG_INIT_OPTIONS,
  STUDIO_EVENT_NAMES,
  buildPostHogOptions,
  createAnalyticsClient,
  formatError,
  isAnalyticsEnabled,
  resolvePostHogConfig,
} from "../src/index";

describe("isAnalyticsEnabled", () => {
  it("is false in dev without opt-in env flags", () => {
    assert.equal(
      isAnalyticsEnabled({ PROD: false, VITE_PUBLIC_POSTHOG_DEV: undefined }),
      false,
    );
    assert.equal(
      isAnalyticsEnabled({ NODE_ENV: "development", NEXT_PUBLIC_POSTHOG_DEV: undefined }),
      false,
    );
  });

  it("is true in production", () => {
    assert.equal(isAnalyticsEnabled({ PROD: true }), true);
    assert.equal(isAnalyticsEnabled({ NODE_ENV: "production" }), true);
  });

  it("is true in dev when VITE_PUBLIC_POSTHOG_DEV is set", () => {
    assert.equal(
      isAnalyticsEnabled({ PROD: false, VITE_PUBLIC_POSTHOG_DEV: "true" }),
      true,
    );
    assert.equal(isAnalyticsEnabled({ PROD: false, VITE_PUBLIC_POSTHOG_DEV: true }), true);
  });

  it("is true in dev when NEXT_PUBLIC_POSTHOG_DEV is set", () => {
    assert.equal(
      isAnalyticsEnabled({ NODE_ENV: "development", NEXT_PUBLIC_POSTHOG_DEV: "true" }),
      true,
    );
  });

  it("is true when generic POSTHOG_DEV is set", () => {
    assert.equal(isAnalyticsEnabled({ POSTHOG_DEV: "true" }), true);
  });
});

describe("resolvePostHogConfig", () => {
  it("returns null when analytics is disabled", () => {
    assert.equal(
      resolvePostHogConfig({
        PROD: false,
        VITE_PUBLIC_POSTHOG_KEY: "k",
        VITE_PUBLIC_POSTHOG_HOST: "h",
      }),
      null,
    );
  });

  it("returns null when the key is missing", () => {
    assert.equal(resolvePostHogConfig({ PROD: true, VITE_PUBLIC_POSTHOG_HOST: "h" }), null);
    assert.equal(
      resolvePostHogConfig({ NODE_ENV: "production", NEXT_PUBLIC_POSTHOG_HOST: "h" }),
      null,
    );
  });

  it("returns null when the host is missing", () => {
    assert.equal(resolvePostHogConfig({ PROD: true, VITE_PUBLIC_POSTHOG_KEY: "k" }), null);
  });

  it("returns { token, host } from Vite env", () => {
    assert.deepEqual(
      resolvePostHogConfig({
        PROD: true,
        VITE_PUBLIC_POSTHOG_KEY: "k",
        VITE_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com/",
      }),
      { token: "k", host: "https://eu.i.posthog.com" },
    );
  });

  it("returns { token, host } from Next.js env", () => {
    assert.deepEqual(
      resolvePostHogConfig({
        NODE_ENV: "production",
        NEXT_PUBLIC_POSTHOG_KEY: "next-key",
        NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
      }),
      { token: "next-key", host: "https://us.i.posthog.com" },
    );
  });
});

describe("POSTHOG_INIT_OPTIONS & buildPostHogOptions", () => {
  it("disables screen recording by default (no screen replay)", () => {
    assert.equal(POSTHOG_INIT_OPTIONS.disable_session_recording, true);
    const built = buildPostHogOptions({ appName: "studio" });
    assert.equal(built.disable_session_recording, true);
  });

  it("enables error, performance, and dead click capture", () => {
    assert.equal(POSTHOG_INIT_OPTIONS.capture_pageview, false);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_pageleave, true);
    assert.equal(POSTHOG_INIT_OPTIONS.autocapture, true);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_dead_clicks, true);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_performance, true);
    assert.deepEqual(POSTHOG_INIT_OPTIONS.capture_exceptions, {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: true,
    });
  });
});

describe("formatError", () => {
  it("formats Error instance", () => {
    const error = new Error("Failed to load");
    const { properties } = formatError(error, { extra: 123 });
    assert.equal(properties.message, "Failed to load");
    assert.equal(properties.name, "Error");
    assert.equal(properties.extra, 123);
  });

  it("extracts error digest when present", () => {
    const error = Object.assign(new Error("Next error"), { digest: "NEXT_DIGEST_99" });
    const { properties } = formatError(error);
    assert.equal(properties.digest, "NEXT_DIGEST_99");
  });

  it("formats string errors", () => {
    const { errorInstance, properties } = formatError("network timeout");
    assert.equal(errorInstance.message, "network timeout");
    assert.equal(properties.message, "network timeout");
  });
});

describe("createAnalyticsClient", () => {
  it("creates a safe client when disabled", () => {
    const client = createAnalyticsClient({
      appName: "test",
      enabled: false,
    });

    assert.equal(client.appName, "test");
    assert.equal(client.isEnabled(), false);
    assert.equal(client.isReady(), false);
    assert.equal(client.isFeatureEnabled("any-flag"), false);
    assert.equal(client.getFeatureFlag("any-flag"), undefined);

    // Calling tracking functions does not throw
    assert.doesNotThrow(() => {
      client.track("logout", {});
      client.trackPageview("/home");
      client.captureException(new Error("silent error"));
      client.identify("u123");
      client.reset();
    });
  });
});

describe("Event Catalogs", () => {
  it("contains the full Studio 49-event catalog", () => {
    assert.equal(STUDIO_EVENT_NAMES.length, 49);
    assert.deepEqual(POSTHOG_EVENT_NAMES, STUDIO_EVENT_NAMES);

    const set = new Set(STUDIO_EVENT_NAMES);
    assert.equal(set.size, 49);
    for (const name of STUDIO_EVENT_NAMES) {
      assert.match(name, /^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });

  it("contains valid snake_case Auth events", () => {
    assert.ok(AUTH_EVENT_NAMES.length > 10);
    const set = new Set(AUTH_EVENT_NAMES);
    assert.equal(set.size, AUTH_EVENT_NAMES.length);
    for (const name of AUTH_EVENT_NAMES) {
      assert.match(name, /^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });
});

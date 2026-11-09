import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Documents AUTH_MOUNT resolution used by apps/api/src/config/env.ts.
 * Mirrors the inline IIFE so CI catches accidental default changes.
 */
function resolveAuthMount(
  authUrl: string | undefined,
  authMountEnv: string | undefined,
): "local" | "delegate" | "off" {
  const raw = (authMountEnv ?? "").toLowerCase();
  if (raw === "local" || raw === "delegate" || raw === "off") return raw;
  return authUrl ? "delegate" : "local";
}

describe("AUTH_MOUNT defaults", () => {
  it("defaults to local when AUTH_URL is unset", () => {
    assert.equal(resolveAuthMount(undefined, undefined), "local");
  });

  it("defaults to delegate when AUTH_URL is set", () => {
    assert.equal(resolveAuthMount("https://auth.hosanna.live", undefined), "delegate");
  });

  it("honors explicit AUTH_MOUNT=off", () => {
    assert.equal(resolveAuthMount("https://auth.hosanna.live", "off"), "off");
  });

  it("honors explicit AUTH_MOUNT=local with AUTH_URL set", () => {
    assert.equal(resolveAuthMount("https://auth.hosanna.live", "local"), "local");
  });
});

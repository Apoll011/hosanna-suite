// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scheduleIdle, type IdleHost } from "../src/chat/idle";

describe("scheduleIdle", () => {
  it("uses requestIdleCallback with a timeout when available", () => {
    const calls: Array<{ timeout: number }> = [];
    let cancelled: number | null = null;
    let task: (() => void) | null = null;
    const host: IdleHost = {
      requestIdleCallback: (cb, opts) => {
        task = cb;
        calls.push(opts ?? { timeout: -1 });
        return 7;
      },
      cancelIdleCallback: (handle) => {
        cancelled = handle;
      },
      setTimeout: () => assert.fail("should not fall back to setTimeout"),
      clearTimeout: () => undefined,
    };
    let ran = false;
    const cancel = scheduleIdle(() => (ran = true), host, 1500);
    assert.deepEqual(calls, [{ timeout: 1500 }]);
    task!();
    assert.equal(ran, true);
    cancel();
    assert.equal(cancelled, 7);
  });

  it("falls back to a timer when idle callbacks are missing", () => {
    let delay = -1;
    let cleared: unknown = null;
    const host: IdleHost = {
      setTimeout: (_cb, ms) => {
        delay = ms;
        return "timer";
      },
      clearTimeout: (handle) => {
        cleared = handle;
      },
    };
    const cancel = scheduleIdle(() => undefined, host, 900);
    assert.equal(delay, 900);
    cancel();
    assert.equal(cleared, "timer");
  });
});

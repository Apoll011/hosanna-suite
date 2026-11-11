/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { AI_NAVIGATE_EVENT, AI_PRINT_EVENT } from "../src/core/bridge/contextBridge.ts";
import { maybeDispatchHostActions } from "../src/core/bridge/hostActions.ts";
import { AI_OPEN_APP_EVENT } from "../src/core/bridge/openApp.ts";
import { AUTH_HOST_PROFILE, STUDIO_HOST_PROFILE } from "../src/host/capabilities.ts";
import type { LogosHost } from "../src/host/types.ts";

function stubHost(profile: LogosHost["profile"], slugPrefix = "/acme"): LogosHost {
  return {
    api: {
      getSettings: async () => {
        throw new Error("unused");
      },
      streamChat: async () => {
        throw new Error("unused");
      },
      confirmAction: async () => ({ confirmed: false }),
    },
    t: (k) => k,
    tc: (k) => k,
    language: "en",
    locale: "en-US",
    scope: null,
    slugPrefix,
    canUseAi: true,
    canUpdateSong: true,
    canUpdateService: true,
    deriveView: () => "general",
    profile,
  };
}

function installWindowCapture() {
  const events: Array<{ type: string; detail: unknown }> = [];
  const w = {
    dispatchEvent(ev: Event) {
      events.push({ type: ev.type, detail: (ev as CustomEvent).detail });
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  Object.defineProperty(globalThis, "window", {
    value: w,
    writable: true,
    configurable: true,
  });
  return events;
}

describe("maybeDispatchHostActions", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("dispatches local navigate on Studio", () => {
    const events = installWindowCapture();
    maybeDispatchHostActions(
      "studio_navigate",
      JSON.stringify({
        studioNavigate: true,
        kind: "song",
        id: "song-1",
      }),
      stubHost(STUDIO_HOST_PROFILE),
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_NAVIGATE_EVENT);
    assert.deepEqual(events[0].detail, {
      kind: "song",
      id: "song-1",
      route: undefined,
      reason: undefined,
    });
  });

  it("does NOT auto open_app for navigate on Auth (stay in chat)", () => {
    const events = installWindowCapture();
    maybeDispatchHostActions(
      "studio_navigate",
      {
        studioNavigate: true,
        kind: "song",
        id: "song-1",
        reason: "review",
      },
      stubHost(AUTH_HOST_PROFILE, "/acme"),
    );
    assert.equal(events.length, 0);
  });

  it("does NOT auto open_app for print on Auth (stay in chat)", () => {
    const events = installWindowCapture();
    maybeDispatchHostActions(
      "studio_generate_pdf",
      {
        studioPrint: true,
        kind: "song",
        ids: ["song-1"],
        reason: "print",
      },
      stubHost(AUTH_HOST_PROFILE, "/acme"),
    );
    assert.equal(events.length, 0);
  });

  it("keeps local print on Studio", () => {
    const events = installWindowCapture();
    maybeDispatchHostActions(
      "studio_generate_pdf",
      {
        studioPrint: true,
        kind: "song",
        ids: ["song-1"],
      },
      stubHost(STUDIO_HOST_PROFILE),
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_PRINT_EVENT);
  });

  it("still dispatches explicit open_app on Auth", () => {
    const events = installWindowCapture();
    maybeDispatchHostActions(
      "open_app",
      {
        openApp: true,
        app: "studio",
        path: "/acme/songs/song-1",
        openIn: "same",
      },
      stubHost(AUTH_HOST_PROFILE),
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_OPEN_APP_EVENT);
    assert.deepEqual(events[0].detail, {
      app: "studio",
      path: "/acme/songs/song-1",
      openIn: "same",
      reason: undefined,
    });
  });
});

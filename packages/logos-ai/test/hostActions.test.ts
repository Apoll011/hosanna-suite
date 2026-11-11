/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { dispatchLogosActions, parseToolActions } from "../src/actions/index.ts";
import { AI_NAVIGATE_EVENT, AI_PRINT_EVENT } from "../src/core/bridge/contextBridge.ts";
import { AI_OPEN_APP_EVENT } from "../src/core/bridge/openApp.ts";
import { createCatalog } from "../src/catalog/create.ts";
import { AUTH_HOST_PROFILE, STUDIO_HOST_PROFILE } from "../src/kernel/capabilities.ts";
import { createLogosHost, type LogosHost } from "../src/kernel/host.ts";

function stubHost(profile: LogosHost["profile"], slugPrefix = "/acme"): LogosHost {
  return createLogosHost({
    profile,
    catalog: createCatalog({
      handlers: {},
      canUpdate: { song: true, service: true },
    }),
    chat: {
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
    deriveView: () => "general",
  });
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

describe("dispatchLogosActions", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("dispatches local navigate on Studio", () => {
    const events = installWindowCapture();
    const actions = parseToolActions("studio_navigate", {
      studioNavigate: true,
      kind: "song",
      id: "song-1",
    });
    dispatchLogosActions(actions, stubHost(STUDIO_HOST_PROFILE));
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_NAVIGATE_EVENT);
  });

  it("does NOT auto-navigate on Auth", () => {
    const events = installWindowCapture();
    const actions = parseToolActions("studio_navigate", {
      studioNavigate: true,
      kind: "song",
      id: "song-1",
    });
    dispatchLogosActions(actions, stubHost(AUTH_HOST_PROFILE));
    assert.equal(events.length, 0);
  });

  it("does NOT auto-print on Auth", () => {
    const events = installWindowCapture();
    const actions = parseToolActions("studio_generate_pdf", {
      studioPrint: true,
      kind: "song",
      ids: ["song-1"],
    });
    dispatchLogosActions(actions, stubHost(AUTH_HOST_PROFILE));
    assert.equal(events.length, 0);
  });

  it("keeps local print on Studio", () => {
    const events = installWindowCapture();
    const actions = parseToolActions("studio_generate_pdf", {
      studioPrint: true,
      kind: "song",
      ids: ["song-1"],
    });
    dispatchLogosActions(actions, stubHost(STUDIO_HOST_PROFILE));
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_PRINT_EVENT);
  });

  it("dispatches explicit open_app everywhere", () => {
    const events = installWindowCapture();
    const actions = parseToolActions("open_app", {
      openApp: true,
      app: "studio",
      path: "/acme/songs/1",
      openIn: "same",
    });
    dispatchLogosActions(actions, stubHost(AUTH_HOST_PROFILE));
    assert.equal(events.length, 1);
    assert.equal(events[0].type, AI_OPEN_APP_EVENT);
  });
});

describe("parseToolActions", () => {
  it("parses song proposals via resource registry", () => {
    const actions = parseToolActions("songs_propose_edit", {
      proposal: { id: "s1", content: "{title: A}", title: "A" },
    });
    assert.equal(actions.length, 1);
    assert.equal(actions[0].type, "propose");
    if (actions[0].type === "propose") {
      assert.equal(actions[0].proposal.kind, "song");
      assert.equal(actions[0].proposal.entityId, "s1");
    }
  });
});

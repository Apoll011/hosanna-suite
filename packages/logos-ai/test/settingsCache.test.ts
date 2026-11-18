import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  isAiChatEnabled,
  readCachedSettings,
  readCachedVisibility,
  resetAiSettingsCacheForTests,
  writeCachedSettings,
} from "../src/chat/settingsCache";
import type { AiSettingsPublic } from "../src/types";

function settings(overrides: Partial<AiSettingsPublic> = {}): AiSettingsPublic {
  return {
    provider: "openai",
    model: "gpt",
    enabled: true,
    configured: true,
    baseUrl: null,
    encryptionReady: true,
    maxToolCalls: 8,
    temperature: null,
    maxOutputTokens: null,
    instructions: "Private org instructions",
    memoryEnabled: false,
    limits: {
      maxToolCalls: { min: 1, max: 16, default: 8 },
      temperature: { min: 0, max: 2 },
      maxOutputTokens: { min: 256, max: 8192 },
      instructionsMaxChars: 2000,
      memoryMaxEntries: 50,
      memoryEntryMaxChars: 500,
    },
    providers: ["openai"],
    modelPresets: { openai: [], anthropic: [], google: [], deepseek: [], openai_compatible: [] },
    ...overrides,
  };
}

function installSessionStorage() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  };
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
  return map;
}

describe("AI settings cache", () => {
  let stored: Map<string, string>;

  beforeEach(() => {
    resetAiSettingsCacheForTests();
    stored = installSessionStorage();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  it("returns nothing for a scope it has never seen", () => {
    assert.equal(readCachedSettings("org-a:user-1"), null);
    assert.equal(readCachedVisibility("org-a:user-1"), null);
  });

  it("serves the last settings for the same scope only", () => {
    const value = settings();
    writeCachedSettings("org-a:user-1", value);
    assert.equal(readCachedSettings("org-a:user-1"), value);
    assert.equal(readCachedSettings("org-b:user-1"), null);
    assert.equal(readCachedVisibility("org-b:user-1"), null);
  });

  it("keeps visibility across reloads without storing org instructions", () => {
    writeCachedSettings("org-a:user-1", settings());
    resetAiSettingsCacheForTests();
    assert.equal(readCachedSettings("org-a:user-1"), null);
    assert.equal(readCachedVisibility("org-a:user-1"), true);
    for (const value of stored.values()) {
      assert.ok(!value.includes("Private org instructions"));
    }
  });

  it("remembers that AI is off so the toggle stays hidden", () => {
    writeCachedSettings("org-a:user-1", settings({ enabled: false }));
    assert.equal(readCachedVisibility("org-a:user-1"), false);
    writeCachedSettings("org-a:user-1", settings({ enabled: true, configured: false }));
    assert.equal(readCachedVisibility("org-a:user-1"), false);
  });

  it("works when sessionStorage is unavailable", () => {
    Reflect.deleteProperty(globalThis, "sessionStorage");
    writeCachedSettings("org-a:user-1", settings());
    assert.equal(readCachedVisibility("org-a:user-1"), null);
    assert.ok(readCachedSettings("org-a:user-1"));
  });

  it("treats the chat as enabled only when configured and enabled", () => {
    assert.equal(isAiChatEnabled({ configured: true, enabled: true }), true);
    assert.equal(isAiChatEnabled({ configured: true, enabled: false }), false);
    assert.equal(isAiChatEnabled({ configured: false, enabled: true }), false);
  });
});

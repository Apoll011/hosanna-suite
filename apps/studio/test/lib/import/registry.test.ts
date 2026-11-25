/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { SongImportRegistry } from "../../../src/lib/import/registry";
import type { SongImportProvider } from "../../../src/lib/import/types";

function makeProvider(id: string, isActive: () => Promise<boolean>): SongImportProvider {
  return {
    id,
    name: id,
    fileTypeName: id,
    description: id,
    supportedExtensions: [`.${id}`],
    interactive: false,
    isActive,
    import: async () => ({ imported: [], failed: [] }),
  };
}

describe("SongImportRegistry.refresh", () => {
  it("skips console.error for transient network errors", async () => {
    const errorMock = mock.method(console, "error", () => {});
    try {
      const registry = new SongImportRegistry();
      registry.register(
        makeProvider("transient", async () => {
          throw new TypeError("Failed to fetch");
        }),
      );
      registry.register(makeProvider("active", async () => true));

      await registry.refresh();

      assert.equal(errorMock.mock.callCount(), 0);
      assert.equal(registry.getProviderById("transient"), undefined);
      assert.ok(registry.getProviderById("active"));
    } finally {
      errorMock.mock.restore();
    }
  });

  it("logs console.error for non-transient activation errors", async () => {
    const errorMock = mock.method(console, "error", () => {});
    try {
      const registry = new SongImportRegistry();
      const failure = new Error("Invalid provider config");
      registry.register(
        makeProvider("broken", async () => {
          throw failure;
        }),
      );

      await registry.refresh();

      assert.equal(errorMock.mock.callCount(), 1);
      assert.equal(
        errorMock.mock.calls[0]?.arguments[0],
        'Failed to activate import provider "broken".',
      );
      assert.equal(errorMock.mock.calls[0]?.arguments[1], failure);
    } finally {
      errorMock.mock.restore();
    }
  });
});

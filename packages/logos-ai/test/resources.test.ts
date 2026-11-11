/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getResource,
  getResourceByDomainId,
  listResources,
} from "../src/resources/index.js";

describe("Logos resources ↔ domain ids", () => {
  it("maps song/service to music.* domain ids", () => {
    assert.equal(getResource("song").domainId, "music.song");
    assert.equal(getResource("service").domainId, "music.service");
  });

  it("looks up resources by domain id", () => {
    assert.equal(getResourceByDomainId("music.song")?.kind, "song");
    assert.equal(getResourceByDomainId("music.service")?.kind, "service");
    assert.equal(getResourceByDomainId("finance.fund"), undefined);
  });

  it("lists registered resources with domain ids", () => {
    const ids = listResources().map((r) => r.domainId);
    assert.ok(ids.includes("music.song"));
    assert.ok(ids.includes("music.service"));
  });
});

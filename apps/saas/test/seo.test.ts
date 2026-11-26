// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRouteMeta, ROUTE_META, SITE_URL } from "../src/lib/seo";

describe("route metadata", () => {
  it("provides metadata for every static route and falls back to the home page", () => {
    assert.ok(Object.keys(ROUTE_META).length > 0);
    assert.equal(getRouteMeta("/"), ROUTE_META["/"]);
    assert.equal(getRouteMeta("/unknown"), ROUTE_META["/"]);
    assert.equal(ROUTE_META["/"]?.url, SITE_URL);
  });
});

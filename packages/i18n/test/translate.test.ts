import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { interpolate, lookup, resolveString } from "../src/translate.js";

const dict = {
  greeting: "Hello {name}",
  nested: {
    title: "Songs",
    empty: "No songs for {org}",
    deep: { ok: "fine" },
  },
  count: { one: "1 item", other: "{n} items" },
};

describe("lookup", () => {
  it("walks nested dictionaries by dot-path", () => {
    assert.equal(lookup(dict, "greeting"), "Hello {name}");
    assert.equal(lookup(dict, "nested.title"), "Songs");
    assert.equal(lookup(dict, "nested.deep.ok"), "fine");
  });

  it("returns undefined for missing segments or non-objects", () => {
    assert.equal(lookup(dict, "missing"), undefined);
    assert.equal(lookup(dict, "nested.missing"), undefined);
    assert.equal(lookup(dict, "greeting.extra"), undefined);
    assert.equal(lookup(null, "greeting"), undefined);
    assert.equal(lookup("plain", "greeting"), undefined);
  });
});

describe("interpolate", () => {
  it("replaces known placeholders and leaves unknowns", () => {
    assert.equal(interpolate("Hello {name}", { name: "Ada" }), "Hello Ada");
    assert.equal(
      interpolate("Hello {name}, {count} left", { name: "Ada", count: 3 }),
      "Hello Ada, 3 left",
    );
    assert.equal(interpolate("Hello {name}", {}), "Hello {name}");
    assert.equal(interpolate("static"), "static");
  });
});

describe("resolveString", () => {
  it("looks up string leaves and interpolates them", () => {
    assert.equal(
      resolveString(dict, "greeting", { name: "Hosanna" }),
      "Hello Hosanna",
    );
    assert.equal(
      resolveString(dict, "nested.empty", { org: "Alpha" }),
      "No songs for Alpha",
    );
  });

  it("returns undefined for missing or non-string leaves", () => {
    assert.equal(resolveString(dict, "missing"), undefined);
    assert.equal(resolveString(dict, "nested"), undefined);
    assert.equal(resolveString(dict, "count"), undefined);
  });
});

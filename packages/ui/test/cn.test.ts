import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "../src/cn.js";

describe("cn", () => {
  it("joins truthy class names", () => {
    assert.equal(cn("a", false && "b", "c"), "a c");
    assert.equal(cn("px-2", null, undefined, "py-1"), "px-2 py-1");
  });

  it("merges conflicting Tailwind utilities", () => {
    assert.equal(cn("px-2", "px-4"), "px-4");
    assert.equal(cn("text-sm text-red-500", "text-lg"), "text-red-500 text-lg");
    assert.equal(cn("bg-white", "bg-black"), "bg-black");
  });

  it("supports conditional objects and arrays", () => {
    assert.equal(
      cn(["base", { active: true, disabled: false }], "extra"),
      "base active extra",
    );
  });
});

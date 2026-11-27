import assert from "node:assert/strict";
import test from "node:test";
import { clamp, createSpring, stepSpring, tuneSpring } from "../src/motion";

test("spring values move toward their target", () => {
  const value = createSpring(0, 300, 23);
  value.t = 1;
  for (let frame = 0; frame < 30; frame += 1) stepSpring(value, 1 / 60);
  assert.ok(value.x > 0);
  assert.ok(value.x < 1.1);
});

test("reduced motion tuning uses critical damping", () => {
  const value = createSpring(0);
  tuneSpring(value, 400, 12, true);
  assert.equal(value.c, 40);
});

test("clamp keeps spring presentation within the rendered bounds", () => {
  assert.equal(clamp(-0.2, 0, 1), 0);
  assert.equal(clamp(1.2, 0, 1), 1);
  assert.equal(clamp(0.4, 0, 1), 0.4);
});

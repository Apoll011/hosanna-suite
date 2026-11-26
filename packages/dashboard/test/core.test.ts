import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDefaultLayout,
  createWidgetRegistry,
  deserializeLayout,
  mergeNewEligibleWidgets,
  mobileOrder,
  normalizeLayout,
  serializeLayout,
} from "../src/core/index.js";
import type { WidgetDefinition } from "../src/core/types.js";

const authApp = { id: "auth", status: "live", accessible: true };
const base: WidgetDefinition = {
  id: "auth.launcher",
  app: "auth",
  title: "launcher.title",
  description: "launcher.description",
  icon: "grid",
  minSize: { w: 2, h: 1 },
  defaultSize: { w: 4, h: 2 },
  maxSize: { w: 8, h: 5 },
  singleton: true,
  defaultFor: [{ role: "owner", priority: 10 }],
};

test("registry composes apps and rejects duplicate identifiers", () => {
  const other = { ...base, id: "studio.health", app: "studio" };
  assert.deepEqual(createWidgetRegistry([base], [other]).list().map((item) => item.id), ["auth.launcher", "studio.health"]);
  assert.throws(() => createWidgetRegistry([base], [base]), /Duplicate widget id/);
});

test("layout serialization round trips and keeps unknown records and metadata", () => {
  const registry = createWidgetRegistry([base]);
  const unknown = { instanceId: "future:1", widget: "future.widget", x: 0, y: 3, w: 2, h: 1, config: { futureFlag: true }, futureData: "keep" };
  const layout = normalizeLayout({ version: 7, items: [unknown], hidden: [], seen: ["future.widget"], futureLayout: "keep" }, registry);
  const parsed = deserializeLayout(serializeLayout(layout), registry);
  assert.equal(parsed.items[0]?.widget, "future.widget");
  assert.equal(parsed.items[0]?.futureData, "keep");
  assert.equal(parsed.items[0]?.config?.futureFlag, true);
  assert.equal(parsed.futureLayout, "keep");
});

test("normalization clamps dimensions, resolves collisions and removes duplicate ids and singletons", () => {
  const registry = createWidgetRegistry([base]);
  const layout = normalizeLayout({ version: 1, hidden: [], seen: [], items: [
    { instanceId: "a", widget: base.id, x: -3, y: 0, w: 99, h: 0 },
    { instanceId: "b", widget: base.id, x: 0, y: 0, w: 3, h: 2 },
    { instanceId: "a", widget: "unknown", x: 4, y: 0, w: 2, h: 1 },
  ] }, registry);
  assert.equal(layout.items.length, 1);
  assert.deepEqual([layout.items[0]?.x, layout.items[0]?.w, layout.items[0]?.h], [0, 8, 2]);
});

test("defaults filter permissions, role, unavailable owners and pack deterministically", () => {
  const definitions = [
    base,
    { ...base, id: "auth.billing", defaultFor: [{ role: "owner", priority: 5 }], requires: ["billing.access"] },
    { ...base, id: "planning.service", app: "planning", defaultFor: [{ role: "owner", priority: 4 }] },
  ];
  const registry = createWidgetRegistry(definitions);
  const context = { permissions: ["billing.access"], orgRole: "owner", apps: [authApp, { id: "planning", status: "coming_soon" }] };
  const first = buildDefaultLayout(context, registry);
  const second = buildDefaultLayout(context, registry);
  assert.deepEqual(first, second);
  assert.deepEqual(first.items.map((item) => item.widget), ["auth.launcher", "auth.billing"]);
  assert.equal(buildDefaultLayout({ ...context, orgRole: "member", permissions: [] }, registry).items.length, 0);
});

test("new eligible widgets merge without replacing a customized layout", () => {
  const registry = createWidgetRegistry([base, { ...base, id: "auth.new", singleton: true }]);
  const customized = normalizeLayout({ version: 1, items: [{ instanceId: "custom", widget: base.id, x: 5, y: 2, w: 3, h: 2 }], hidden: [], seen: [base.id] }, registry);
  const merged = mergeNewEligibleWidgets(customized, { permissions: [], orgRole: "owner", apps: [authApp] }, registry);
  assert.deepEqual(merged.items.map((item) => item.instanceId), ["custom", "auth.new:introduced"]);
  assert.deepEqual([merged.items[0]?.x, merged.items[0]?.y], [5, 2]);
  assert.deepEqual(mobileOrder(merged).map((item) => item.instanceId), ["custom", "auth.new:introduced"]);
});

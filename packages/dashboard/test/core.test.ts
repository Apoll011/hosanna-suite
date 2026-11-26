import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDefaultLayout,
  beginDashboardDraft,
  cancelDashboardDraft,
  commitDashboardDraft,
  createWidgetRegistry,
  createValidatedPersistence,
  deserializeLayout,
  loadOrCreateDashboard,
  mergeNewEligibleWidgets,
  mobileOrder,
  normalizeLayout,
  serializeLayout,
} from "../src/core/index.js";
import type { DashboardPersistence, WidgetDefinition } from "../src/core/types.js";
import {
  listMissingWidgetRenderers,
  listRenderableWidgets,
} from "../src/react/rendererRegistry.js";
import type { WidgetRenderers } from "../src/react/Dashboard.js";

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
  assert.deepEqual(
    createWidgetRegistry([base], [other])
      .list()
      .map((item) => item.id),
    ["auth.launcher", "studio.health"],
  );
  assert.throws(() => createWidgetRegistry([base], [base]), /Duplicate widget id/);
});

test("renderer registration reports missing components without changing core registration", () => {
  const registry = createWidgetRegistry([base]);
  const renderers: WidgetRenderers = {};
  assert.deepEqual(listMissingWidgetRenderers(registry, renderers), [base.id]);
  assert.deepEqual(listRenderableWidgets(registry, renderers), []);
  assert.equal(registry.get(base.id), base);
});

test("layout serialization round trips and keeps unknown records and metadata", () => {
  const registry = createWidgetRegistry([base]);
  const unknown = {
    instanceId: "future:1",
    widget: "future.widget",
    x: 0,
    y: 3,
    w: 2,
    h: 1,
    config: { futureFlag: true },
    futureData: "keep",
  };
  const layout = normalizeLayout(
    { version: 7, items: [unknown], hidden: [], seen: ["future.widget"], futureLayout: "keep" },
    registry,
  );
  const parsed = deserializeLayout(serializeLayout(layout), registry);
  assert.equal(parsed.items[0]?.widget, "future.widget");
  assert.equal(parsed.items[0]?.futureData, "keep");
  assert.equal(parsed.items[0]?.config?.futureFlag, true);
  assert.equal(parsed.futureLayout, "keep");
});

test("normalization clamps dimensions, resolves collisions and removes duplicate ids and singletons", () => {
  const registry = createWidgetRegistry([base]);
  const layout = normalizeLayout(
    {
      version: 1,
      hidden: [],
      seen: [],
      items: [
        { instanceId: "a", widget: base.id, x: -3, y: 0, w: 99, h: 0 },
        { instanceId: "b", widget: base.id, x: 0, y: 0, w: 3, h: 2 },
        { instanceId: "a", widget: "unknown", x: 4, y: 0, w: 2, h: 1 },
      ],
    },
    registry,
  );
  assert.equal(layout.items.length, 1);
  assert.deepEqual([layout.items[0]?.x, layout.items[0]?.w, layout.items[0]?.h], [0, 8, 1]);
});

test("defaults filter permissions, role, unavailable owners and pack deterministically", () => {
  const definitions = [
    base,
    {
      ...base,
      id: "auth.billing",
      defaultFor: [{ role: "owner", priority: 5 }],
      requires: ["billing.access"],
    },
    {
      ...base,
      id: "planning.service",
      app: "planning",
      defaultFor: [{ role: "owner", priority: 4 }],
    },
  ];
  const registry = createWidgetRegistry(definitions);
  const context = {
    permissions: ["billing.access"],
    orgRole: "owner",
    apps: [authApp, { id: "planning", status: "coming_soon" }],
  };
  const first = buildDefaultLayout(context, registry);
  const second = buildDefaultLayout(context, registry);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.items.map((item) => item.widget),
    ["auth.launcher", "auth.billing"],
  );
  assert.equal(
    buildDefaultLayout({ ...context, orgRole: "member", permissions: [] }, registry).items.length,
    0,
  );
});

test("defaults are role-specific and exclude widgets with unmet requirements", () => {
  const byRole = ["owner", "admin", "editor", "musician", "guest"].map((role) => ({
    ...base,
    id: "auth." + role,
    defaultFor: [{ role, priority: 1 }],
  }));
  const restricted = {
    ...base,
    id: "auth.restricted",
    requires: ["billing.access"],
    defaultFor: [{ role: "owner", priority: 2 }],
  };
  const registry = createWidgetRegistry([...byRole, restricted]);
  const apps = [authApp];
  for (const role of ["owner", "admin", "editor", "musician", "guest"]) {
    const layout = buildDefaultLayout({ permissions: [], orgRole: role, apps }, registry);
    assert.deepEqual(
      layout.items.map((item) => item.widget),
      ["auth." + role],
    );
  }
  assert.deepEqual(
    buildDefaultLayout(
      { permissions: ["billing.access"], orgRole: "owner", apps },
      registry,
    ).items.map((item) => item.widget),
    ["auth.restricted", "auth.owner"],
  );
});

test("configuration defaults, migration and invalid values normalize predictably", () => {
  const configured: WidgetDefinition = {
    ...base,
    config: {
      version: 1,
      defaults: { limit: 5, density: "comfortable" },
      schema: { fields: { limit: { type: "number", min: 1, max: 25 } } },
      migrations: [{ from: 0, to: 1, renameFields: { count: "limit" } }],
    },
  };
  const registry = createWidgetRegistry([configured]);
  const migrated = normalizeLayout(
    {
      version: 1,
      items: [
        {
          instanceId: "cfg",
          widget: configured.id,
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          config: { count: 8, future: true },
        },
      ],
      hidden: [],
      seen: [],
    },
    registry,
  );
  assert.deepEqual(migrated.items[0]?.config, { limit: 8, density: "comfortable", future: true });
  const invalid = normalizeLayout(
    {
      version: 1,
      items: [
        {
          instanceId: "bad",
          widget: configured.id,
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          config: { limit: "bad", future: true },
        },
      ],
      hidden: [],
      seen: [],
    },
    registry,
  );
  assert.equal(invalid.items[0]?.config?.limit, 5);
});

test("newer layout versions keep their version and unknown top-level fields", () => {
  const registry = createWidgetRegistry([base]);
  const value = normalizeLayout(
    { version: 4, futureSettings: { keep: true }, items: [], hidden: [], seen: [] },
    registry,
  );
  assert.equal(value.version, 4);
  assert.deepEqual(value.futureSettings, { keep: true });
});

test("persistence creates defaults, saves by organization and isolates layouts", async () => {
  const registry = createWidgetRegistry([base]);
  const store = new Map<string, unknown>();
  const basePersistence: DashboardPersistence = {
    load: async (organizationId) => store.get(organizationId) ?? null,
    save: async (organizationId, layout) => {
      store.set(organizationId, layout);
    },
  };
  const persistence = createValidatedPersistence(basePersistence, registry);
  const context = { permissions: [], orgRole: "owner", apps: [authApp] };
  const first = await loadOrCreateDashboard({
    organizationId: "org-a",
    context,
    persistence,
    registry,
  });
  const second = await loadOrCreateDashboard({
    organizationId: "org-b",
    context: { ...context, orgRole: "guest" },
    persistence,
    registry,
  });
  assert.equal(first.items[0]?.widget, base.id);
  assert.equal(second.items.length, 0);
  assert.equal((await persistence.load("org-a"))?.items.length, 1);
  assert.equal((await persistence.load("org-b"))?.items.length, 0);
});

test("draft cancellation has no persistence effect and commit writes once", async () => {
  const registry = createWidgetRegistry([base]);
  const saved = buildDefaultLayout(
    { permissions: [], orgRole: "owner", apps: [authApp] },
    registry,
  );
  const draft = beginDashboardDraft(saved);
  draft.draft.items[0]!.x = 5;
  assert.equal(cancelDashboardDraft(draft).items[0]?.x, 0);
  let writes = 0;
  const persistence = {
    load: async () => null,
    save: async (_organizationId: string, _layout: typeof saved) => {
      writes += 1;
    },
  };
  const committed = await commitDashboardDraft({
    organizationId: "org-a",
    draft: draft.draft,
    persistence,
    registry,
  });
  assert.equal(writes, 1);
  assert.equal(committed.items[0]?.x, 5);
});

test("new eligible widgets merge without replacing a customized layout", () => {
  const registry = createWidgetRegistry([base, { ...base, id: "auth.new", singleton: true }]);
  const customized = normalizeLayout(
    {
      version: 1,
      items: [{ instanceId: "custom", widget: base.id, x: 5, y: 2, w: 3, h: 2 }],
      hidden: [],
      seen: [base.id],
    },
    registry,
  );
  const merged = mergeNewEligibleWidgets(
    customized,
    { permissions: [], orgRole: "owner", apps: [authApp] },
    registry,
  );
  assert.deepEqual(
    merged.items.map((item) => item.instanceId),
    ["custom", "auth.new:introduced"],
  );
  assert.deepEqual([merged.items[0]?.x, merged.items[0]?.y], [5, 2]);
  assert.deepEqual(
    mobileOrder(merged).map((item) => item.instanceId),
    ["custom", "auth.new:introduced"],
  );
});

// SPDX-License-Identifier: AGPL-3.0-only
import { createScopedCache, orgCacheKey, orgUserCacheKey } from "@hosanna/cache";
import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import express from "express";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { beforeEach, describe, it } from "node:test";
import { ORG_SCOPED_MODELS, type OrgScopedPrisma } from "../../src/database/prisma.js";
import { withClientRequestId } from "../../src/mcp/lib/idempotency.js";
import { getPublishProgress, setPublishProgress } from "../../src/mcp/lib/publishProgress.js";
import { registerLibraryTools } from "../../src/mcp/tools/library.js";
import { registerServiceTools } from "../../src/mcp/tools/services.js";
import { registerSongTools } from "../../src/mcp/tools/songs.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { folderRouter } from "../../src/routes/folder.routes.js";
import { replicationRouter } from "../../src/routes/replication.routes.js";
import { serviceRouter } from "../../src/routes/service.routes.js";
import { annotationRouter } from "../../src/routes/serviceSongAnnotation.routes.js";
import { songRouter } from "../../src/routes/song.routes.js";
import { trashRouter } from "../../src/routes/trash.routes.js";
import { syncCache } from "../../src/services/syncCache.service.js";

type Row = Record<string, any>;

function createMultiTenantDb() {
  const tables: Record<string, Row[]> = {
    folder: [],
    collection: [],
    song: [],
    service: [],
    serviceNote: [],
    serviceSongAnnotation: [],
    agendaEvent: [],
    orgAiConfig: [],
    orgAiMemory: [],
  };

  function matchesWhere(row: Row, where: Row | undefined): boolean {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (v === undefined) continue;
      if (k === "OR" && Array.isArray(v)) {
        if (!v.some((sub) => matchesWhere(row, sub))) return false;
        continue;
      }
      if (k === "AND" && Array.isArray(v)) {
        if (!v.every((sub) => matchesWhere(row, sub))) return false;
        continue;
      }
      if (k === "serviceId_songId" && v && typeof v === "object") {
        if (row.serviceId !== v.serviceId || row.songId !== v.songId) return false;
        continue;
      }
      if (v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v)) {
        if ("gt" in v && !(row[k] > v.gt)) return false;
        if ("in" in v && !v.in.includes(row[k])) return false;
        continue;
      }
      if (row[k] !== v) return false;
    }
    return true;
  }

  function makeDelegate(modelName: string, orgId: string) {
    const rows = tables[modelName];
    return {
      async findMany(args: Row = {}) {
        const where = { ...(args.where ?? {}), orgId };
        return rows.filter((r) => matchesWhere(r, where)).map((r) => ({ ...r }));
      },
      async findFirst(args: Row = {}) {
        const where = { ...(args.where ?? {}), orgId };
        const found = rows.find((r) => matchesWhere(r, where));
        return found ? { ...found } : null;
      },
      async findUnique(args: Row = {}) {
        const where = { ...(args.where ?? {}), orgId };
        const found = rows.find((r) => matchesWhere(r, where));
        return found ? { ...found } : null;
      },
      async count(args: Row = {}) {
        const where = { ...(args.where ?? {}), orgId };
        return rows.filter((r) => matchesWhere(r, where)).length;
      },
      async create(args: Row) {
        const now = new Date();
        const doc = {
          id: args.data.id ?? `${modelName}-${rows.length + 1}`,
          createdAt: now,
          updatedAt: now,
          deleted: false,
          ...args.data,
          orgId,
        };
        rows.push(doc);
        return { ...doc };
      },
      async update(args: Row) {
        const where = { ...(args.where ?? {}), orgId };
        const idx = rows.findIndex((r) => matchesWhere(r, where));
        if (idx === -1) {
          const err = new Error("Record to update not found") as Error & { code?: string };
          err.code = "P2025";
          throw err;
        }
        rows[idx] = { ...rows[idx], ...args.data, orgId, updatedAt: new Date() };
        return { ...rows[idx] };
      },
      async updateMany(args: Row) {
        const where = { ...(args.where ?? {}), orgId };
        let count = 0;
        for (let i = 0; i < rows.length; i++) {
          if (matchesWhere(rows[i], where)) {
            rows[i] = { ...rows[i], ...args.data, orgId, updatedAt: new Date() };
            count++;
          }
        }
        return { count };
      },
      async delete(args: Row) {
        const where = { ...(args.where ?? {}), orgId };
        const idx = rows.findIndex((r) => matchesWhere(r, where));
        if (idx === -1) {
          const err = new Error("Record to delete not found") as Error & { code?: string };
          err.code = "P2025";
          throw err;
        }
        const [removed] = rows.splice(idx, 1);
        return { ...removed };
      },
      async deleteMany(args: Row) {
        const where = { ...(args.where ?? {}), orgId };
        let count = 0;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (matchesWhere(rows[i], where)) {
            rows.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
      async upsert(args: Row) {
        const where = { ...(args.where ?? {}), orgId };
        const idx = rows.findIndex((r) => matchesWhere(r, where));
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...args.update, orgId, updatedAt: new Date() };
          return { ...rows[idx] };
        }
        const now = new Date();
        const doc = {
          id: args.create.id ?? `${modelName}-${rows.length + 1}`,
          createdAt: now,
          updatedAt: now,
          ...args.create,
          orgId,
        };
        rows.push(doc);
        return { ...doc };
      },
    };
  }

  function forOrg(orgId: string): OrgScopedPrisma {
    const client: Record<string, any> = {};
    for (const modelName of Object.keys(tables)) {
      client[modelName] = makeDelegate(modelName, orgId);
    }
    client.$transaction = async (fn: (tx: any) => Promise<any>) => fn(client);
    return client as unknown as OrgScopedPrisma;
  }

  return { tables, forOrg };
}

const ORG_A = "org-a";
const ORG_B = "org-b";
const USER_A = "user-a";
const USER_B = "user-b";

describe("Tenant isolation audit", () => {
  beforeEach(async () => {
    await syncCache.invalidateAll();
  });

  it("includes all orgId-scoped models in ORG_SCOPED_MODELS", () => {
    for (const model of [
      "Folder",
      "Collection",
      "Song",
      "Service",
      "ServiceNote",
      "ServiceSongAnnotation",
      "AgendaEvent",
      "OrgAiConfig",
      "OrgAiMemory",
    ]) {
      assert.ok(ORG_SCOPED_MODELS.has(model), `Missing ${model} in ORG_SCOPED_MODELS`);
    }
  });

  it("blocks cross-tenant access across REST routes, notes, annotations, trash, and replication", async () => {
    const store = createMultiTenantDb();
    const dbA = store.forOrg(ORG_A);
    const dbB = store.forOrg(ORG_B);

    const folderA = await dbA.folder.create({ data: { id: "folder-a1", name: "Folder A" } });
    const songA = await dbA.song.create({
      data: {
        id: "song-a1",
        title: "Amazing Grace",
        artist: "Newton",
        content: "{title: Amazing Grace}\n[G]Amazing grace",
        path: "amazing-grace",
        tags: [],
        folderId: folderA.id,
      },
    });
    const trashedSongA = await dbA.song.create({
      data: {
        id: "song-a-trashed",
        title: "Trashed A",
        artist: "A",
        content: "{title: Trashed A}",
        path: "trashed-a",
        tags: [],
        deleted: true,
        purgeAt: new Date(Date.now() + 86_400_000),
      },
    });
    const serviceA = await dbA.service.create({
      data: {
        id: "service-a1",
        title: "Sunday A",
        date: new Date("2026-12-01T10:00:00Z"),
        elements: [],
      },
    });
    const noteA = await dbA.serviceNote.create({
      data: {
        id: "note-a1",
        serviceId: serviceA.id,
        authorId: USER_A,
        body: "Private org A note",
        private: false,
      },
    });
    await dbA.serviceSongAnnotation.upsert({
      where: { serviceId_songId: { serviceId: serviceA.id, songId: songA.id } },
      create: {
        orgId: ORG_A,
        serviceId: serviceA.id,
        songId: songA.id,
        canvasData: new Uint8Array([1, 2, 3, 4]),
        updatedById: USER_A,
      },
      update: {},
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const tenant = req.headers["x-test-tenant"] === "b" ? "b" : "a";
      req.orgId = tenant === "a" ? ORG_A : ORG_B;
      req.locale = "en";
      req.user = {
        id: tenant === "a" ? USER_A : USER_B,
        workspaceId: req.orgId,
        role: "admin",
      };
      req.db = tenant === "a" ? dbA : dbB;
      next();
    });
    app.use("/api/songs", songRouter);
    app.use("/api/folders", folderRouter);
    app.use("/api/services", serviceRouter);
    app.use("/api/annotation", annotationRouter);
    app.use("/api/replication", replicationRouter);
    app.use("/api/trash", trashRouter);
    app.use(errorHandler);

    const server = app.listen(0);
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    try {
      const callAsB = (path: string, init?: RequestInit) =>
        fetch(`${base}${path}`, {
          ...init,
          headers: {
            "content-type": "application/json",
            "x-test-tenant": "b",
            ...(init?.headers ?? {}),
          },
        });

      const forbiddenOrNotFound = (status: number) =>
        status === 403 || status === 404 || status === 400;

      // Songs
      assert.ok(forbiddenOrNotFound((await callAsB(`/api/songs/${songA.id}`)).status));
      assert.ok(
        forbiddenOrNotFound(
          (
            await callAsB(`/api/songs/${songA.id}`, {
              method: "PUT",
              body: JSON.stringify({ title: "Hijacked" }),
            })
          ).status,
        ),
      );
      assert.ok(
        forbiddenOrNotFound((await callAsB(`/api/songs/${songA.id}`, { method: "DELETE" })).status),
      );

      // Folders
      assert.ok(forbiddenOrNotFound((await callAsB(`/api/folders/${folderA.id}`)).status));
      assert.ok(
        forbiddenOrNotFound(
          (
            await callAsB(`/api/folders/${folderA.id}`, {
              method: "PUT",
              body: JSON.stringify({ name: "Hijacked" }),
            })
          ).status,
        ),
      );
      assert.ok(
        forbiddenOrNotFound(
          (await callAsB(`/api/folders/${folderA.id}`, { method: "DELETE" })).status,
        ),
      );

      // Services + Service Notes
      assert.ok(forbiddenOrNotFound((await callAsB(`/api/services/${serviceA.id}`)).status));
      assert.ok(
        forbiddenOrNotFound(
          (
            await callAsB(`/api/services/${serviceA.id}`, {
              method: "PUT",
              body: JSON.stringify({ title: "Hijacked" }),
            })
          ).status,
        ),
      );
      assert.ok(forbiddenOrNotFound((await callAsB(`/api/services/${serviceA.id}/notes`)).status));
      assert.ok(
        forbiddenOrNotFound(
          (
            await callAsB(`/api/services/${serviceA.id}/notes`, {
              method: "POST",
              body: JSON.stringify({ body: "Cross-tenant note" }),
            })
          ).status,
        ),
      );
      assert.ok(
        forbiddenOrNotFound(
          (
            await callAsB(`/api/services/${serviceA.id}/notes/${noteA.id}`, {
              method: "PUT",
              body: JSON.stringify({ body: "Hijacked" }),
            })
          ).status,
        ),
      );
      assert.ok(
        forbiddenOrNotFound(
          (await callAsB(`/api/services/${serviceA.id}/notes/${noteA.id}`, { method: "DELETE" }))
            .status,
        ),
      );

      // Annotations
      assert.ok(
        forbiddenOrNotFound(
          (await callAsB(`/api/annotation/services/${serviceA.id}/songs/${songA.id}/annotation`))
            .status,
        ),
      );

      // Trash restore
      assert.ok(
        forbiddenOrNotFound(
          (await callAsB(`/api/trash/songs/${trashedSongA.id}/restore`, { method: "POST" })).status,
        ),
      );

      // Replication pull must not leak Org A docs to Org B
      const pullRes = await callAsB(`/api/replication/songs/pull`, {
        method: "POST",
        body: JSON.stringify({ checkpoint: null, limit: 50 }),
      });
      assert.equal(pullRes.status, 200);
      const pullBody = (await pullRes.json()) as { documents: Array<{ id: string }> };
      assert.deepEqual(pullBody.documents, []);

      // Replication push with Org A's ID must not overwrite Org A's song
      await callAsB(`/api/replication/songs/push`, {
        method: "POST",
        body: JSON.stringify({
          documents: [
            {
              newDocumentState: {
                id: songA.id,
                title: "Overwritten by B",
                artist: "B",
                content: "{title: Overwritten}",
                path: "overwritten",
                tags: [],
                deleted: false,
                updatedAt: Date.now(),
              },
            },
          ],
        }),
      });
      const stillOrgA = await dbA.song.findFirst({ where: { id: songA.id } });
      assert.equal(stillOrgA?.title, "Amazing Grace");
    } finally {
      server.close();
    }
  });

  it("blocks cross-tenant access in MCP tools", async () => {
    const store = createMultiTenantDb();
    const dbA = store.forOrg(ORG_A);
    const dbB = store.forOrg(ORG_B);

    const songA = await dbA.song.create({
      data: {
        id: "mcp-song-a",
        title: "Org A Song",
        artist: "A",
        content: "{title: Org A Song}\n[C]Hello",
        path: "org-a-song",
        tags: [],
      },
    });
    const serviceA = await dbA.service.create({
      data: {
        id: "mcp-svc-a",
        title: "Org A Service",
        date: new Date("2026-12-01T10:00:00Z"),
        elements: [],
      },
    });

    const handlers = new Map<
      string,
      (input: any, extra: { authInfo?: AuthInfo }) => Promise<any>
    >();
    const mockServer = {
      registerTool(name: string, _config: unknown, handler: any) {
        handlers.set(name, handler);
      },
    } as unknown as McpServer;

    registerSongTools(mockServer);
    registerServiceTools(mockServer);
    registerLibraryTools(mockServer);

    const authB: AuthInfo = {
      token: "tok-b",
      clientId: USER_B,
      scopes: [],
      extra: {
        hosanna: {
          user: { id: USER_B, workspaceId: ORG_B, role: "admin" },
          orgId: ORG_B,
          locale: "en",
          db: dbB,
          token: "tok-b",
          entitled: true,
        },
      },
    };

    const getSongRes = await handlers.get("songs_get")!({ id: songA.id }, { authInfo: authB });
    assert.equal(getSongRes.isError, true);

    const deleteSongRes = await handlers.get("songs_delete")!(
      { id: songA.id },
      { authInfo: authB },
    );
    assert.equal(deleteSongRes.isError, true);

    const getServiceRes = await handlers.get("services_get")!(
      { id: serviceA.id },
      { authInfo: authB },
    );
    assert.equal(getServiceRes.isError, true);

    const stillSongA = await dbA.song.findFirst({ where: { id: songA.id } });
    assert.equal(stillSongA?.deleted, false);
  });

  it("isolates syncCache, publishProgress, idempotency, and scoped caches across orgs and org switches", async () => {
    const cpA = { updatedAt: 1700000000000, id: "doc-1" };
    await syncCache.setLatestCheckpoint(ORG_A, "songs", cpA);
    assert.equal(await syncCache.hasNoChanges(ORG_A, "songs", cpA), true);
    assert.equal(await syncCache.hasNoChanges(ORG_B, "songs", cpA), false);

    await setPublishProgress(ORG_A, "req-1", {
      phase: "service_saved",
      serviceId: "svc-a",
      serviceUpdatedAt: new Date().toISOString(),
    });
    assert.ok((await getPublishProgress(ORG_A, "req-1")) !== undefined);
    assert.equal(await getPublishProgress(ORG_B, "req-1"), undefined);

    const resA = await withClientRequestId(ORG_A, "idem-1", async () => ({ org: "A" }), { x: 1 });
    const resB = await withClientRequestId(ORG_B, "idem-1", async () => ({ org: "B" }), { x: 2 });
    assert.deepEqual(resA, { org: "A" });
    assert.deepEqual(resB, { org: "B" });

    // Simulate a user switching from Org A to Org B on the same session
    const sessionCache = createScopedCache({ namespace: "test:auth-switch" });
    await sessionCache.set(orgUserCacheKey(ORG_A, USER_A, "ctx"), { workspaceId: ORG_A });
    await sessionCache.set(orgCacheKey(ORG_A, "locale"), "pt-BR");

    assert.equal(await sessionCache.get(orgUserCacheKey(ORG_B, USER_A, "ctx")), undefined);
    assert.equal(await sessionCache.get(orgCacheKey(ORG_B, "locale")), undefined);
  });
});

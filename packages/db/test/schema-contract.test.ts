// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { describe, it } from "node:test";

const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrations = await readdir(new URL("../prisma/migrations", import.meta.url));

describe("database schema contract", () => {
  it("contains the models required for core music and service data", () => {
    for (const model of ["Organization", "Folder", "Song", "Service", "ServiceSong"]) {
      assert.match(schema, new RegExp(`model ${model}\\s*\\{`));
    }
  });

  it("keeps tenant scoped uniqueness, replication indexes, and soft deletion fields", () => {
    assert.match(schema, /@@unique\(\[orgId, path\]\)/);
    assert.match(schema, /map: "songs_replication_idx"/);
    assert.match(schema, /deleted\s+Boolean\s+@default\(false\)\s+@map\("_deleted"\)/);
  });

  it("includes an initial migration and Prisma migration lock", async () => {
    assert.ok(migrations.includes("0_init"));
    const lock = await readFile(
      new URL("../prisma/migrations/migration_lock.toml", import.meta.url),
      "utf8",
    );
    assert.match(lock, /provider\s*=\s*"postgresql"/);
  });
});

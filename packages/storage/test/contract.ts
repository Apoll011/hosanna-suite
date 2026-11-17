import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ObjectStorage } from "../src/types.js";

export function runStorageContract(name: string, create: () => ObjectStorage) {
  describe(`${name} storage contract`, () => {
    it("stores, reads, describes, copies, lists, and deletes tenant objects", async () => {
      const storage = create();
      const tenant = storage.forTenant(`contract-${crypto.randomUUID()}`);
      const stored = await tenant.upload({
        key: "songs/one.txt",
        body: new TextEncoder().encode("hello"),
        contentType: "text/plain",
        metadata: { origin: "contract" },
      });
      assert.equal(stored.size, 5);
      assert.equal(await tenant.exists("songs/one.txt"), true);
      assert.equal((await tenant.head("songs/one.txt"))?.contentType, "text/plain");
      assert.equal(await new Response(await tenant.download("songs/one.txt")).text(), "hello");
      const copied = await tenant.copy("songs/one.txt", "songs/two.txt");
      assert.equal(copied.key, "songs/two.txt");
      const listed = await tenant.list({ prefix: "songs/" });
      assert.deepEqual(listed.objects.map(({ key }) => key).sort(), [
        "songs/one.txt",
        "songs/two.txt",
      ]);
      await tenant.deleteMany(["songs/one.txt", "songs/two.txt"]);
      assert.equal(await tenant.exists("songs/one.txt"), false);
    });

    it("isolates tenants and rejects invalid tenant ids", async () => {
      const storage = create();
      const first = storage.forTenant(`first-${crypto.randomUUID()}`);
      const second = storage.forTenant(`second-${crypto.randomUUID()}`);
      await first.upload({ key: "private", body: new Uint8Array([1]) });
      assert.equal(await second.exists("private"), false);
      assert.throws(() => storage.forTenant("../escape"));
    });

    it("creates and aborts multipart uploads", async () => {
      const storage = create();
      const tenant = storage.forTenant(`multipart-${crypto.randomUUID()}`);
      const upload = await tenant.createMultipartUpload({
        key: "large.bin",
        contentType: "application/octet-stream",
      });
      assert.equal(upload.key, "large.bin");
      assert.equal((await tenant.createMultipartPartUrl(upload, 1)).method, "PUT");
      const firstBytes = new Uint8Array(5 * 1024 * 1024).fill(1);
      const secondBytes = new Uint8Array([2]);
      const first = await tenant.uploadMultipartPart(upload, 1, firstBytes);
      const second = await tenant.uploadMultipartPart(upload, 2, secondBytes);
      await tenant.completeMultipartUpload(upload, [first, second]);
      const completed = new Uint8Array(
        await new Response(await tenant.download("large.bin")).arrayBuffer(),
      );
      assert.equal(completed.byteLength, firstBytes.byteLength + secondBytes.byteLength);
      assert.equal(completed[0], 1);
      assert.equal(completed.at(-1), 2);
      await tenant.abortMultipartUpload(upload);
    });
  });
}

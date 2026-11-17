import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryStorage } from "../src/index.js";
import { runStorageContract } from "./contract.js";

runStorageContract("memory", createMemoryStorage);

describe("memory storage", () => {
  it("returns typed not-found errors", async () => {
    await assert.rejects(createMemoryStorage().forTenant("tenant").download("missing"), {
      code: "NOT_FOUND",
    });
  });

  it("rejects keys that escape the tenant namespace", async () => {
    const tenant = createMemoryStorage().forTenant("tenant");
    await assert.rejects(tenant.upload({ key: "../other/private", body: new Uint8Array([1]) }), {
      code: "INVALID_INPUT",
    });
  });

  it("enforces multipart upload ownership and assembles parts in order", async () => {
    const storage = createMemoryStorage();
    const a = storage.forTenant("a");
    const b = storage.forTenant("b");
    const upload = await a.createMultipartUpload({ key: "file" });
    await assert.rejects(b.uploadMultipartPart(upload, 1, new Uint8Array([1])), {
      code: "UPLOAD_NOT_FOUND",
    });
    const second = await a.uploadMultipartPart(upload, 2, new Uint8Array([2]));
    const first = await a.uploadMultipartPart(upload, 1, new Uint8Array([1]));
    await a.completeMultipartUpload(upload, [second, first]);
    assert.deepEqual(
      [...new Uint8Array(await new Response(await a.download("file")).arrayBuffer())],
      [1, 2],
    );
  });
});

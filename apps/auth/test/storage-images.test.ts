// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryStorage } from "@hosanna/storage";
import { createAuthImageStorage } from "../lib/storage/images.js";

describe("auth image storage", () => {
  it("stores avatars under the user namespace and returns a stable media URL", async () => {
    const storage = createMemoryStorage();
    const images = createAuthImageStorage(storage, "https://auth.hosanna.live/");
    const data = `data:image/jpeg;base64,${Buffer.from("avatar-bytes").toString("base64")}`;
    const url = await images.uploadBase64Avatar("user-1", data);

    assert.equal(url, "https://auth.hosanna.live/api/media/user/user-1");
    assert.equal(images.isExternalImageUrl(url), false);
    assert.equal(
      (await storage.forTenant("user-user-1").head("avatar"))?.contentType,
      "image/jpeg",
    );
  });

  it("stores church logos in the organization namespace and removes them", async () => {
    const storage = createMemoryStorage();
    const images = createAuthImageStorage(storage, "https://auth.hosanna.live");
    const data = `data:image/png;base64,${Buffer.from("logo-bytes").toString("base64")}`;

    assert.equal(
      await images.uploadOrganizationLogo("org-1", data),
      "https://auth.hosanna.live/api/media/organization/org-1",
    );
    assert.equal(
      (await storage.forTenant("organization-org-1").head("logo"))?.contentType,
      "image/png",
    );
    await images.deleteOrganizationLogo("org-1");
    assert.equal(await storage.forTenant("organization-org-1").head("logo"), null);
  });

  it("recognizes only valid image URL schemes as external", () => {
    const images = createAuthImageStorage(createMemoryStorage(), "https://auth.hosanna.live");
    assert.equal(images.isExternalImageUrl("https://cdn.example.com/avatar.png"), true);
    assert.equal(images.isExternalImageUrl("https://auth.hosanna.live/api/media/user/u1"), false);
    assert.equal(images.isExternalImageUrl("ftp://cdn.example.com/avatar.png"), false);
  });
});

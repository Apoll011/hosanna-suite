// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SongImportService } from "../../src/services/songImport.service.js";

describe("SongImportService", () => {
  const service = new SongImportService();

  it("fails to retrieve non-existent job", () => {
    assert.throws(() => service.getJob("org-1", "non-existent-id"), {
      message: "Import job not found.",
    });
  });

  it("fails to cancel non-existent job", () => {
    assert.throws(() => service.cancelJob("org-1", "non-existent-id"), {
      message: "Import job not found.",
    });
  });

  it("requires imageBase64 to create a job", async () => {
    await assert.rejects(
      async () =>
        service.createJob({
          orgId: "org-1",
          sourceType: "photo",
          imageBase64: "",
          imageMimeType: "image/jpeg",
        }),
      { message: "imageBase64 is required." },
    );
  });

  it("requires pdfBase64 for PDF source types", async () => {
    await assert.rejects(
      async () =>
        service.createJob({
          orgId: "org-1",
          sourceType: "pdf",
          imageBase64: "dGVzdA==",
          imageMimeType: "image/jpeg",
          pdfBase64: "",
        }),
      { message: "pdfBase64 is required for PDF imports." },
    );
  });

  it("cancels an active job immediately", async () => {
    const job = await service.createJob({
      orgId: "org-1",
      sourceType: "photo",
      imageBase64: "dGVzdA==",
      imageMimeType: "image/jpeg",
    });

    assert.equal(job.status, "running");
    assert.equal(job.steps.length, 5);

    const cancelled = service.cancelJob("org-1", job.id);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.cancelledBy, "user");

    const fetched = service.getJob("org-1", job.id);
    assert.equal(fetched.status, "cancelled");
  });
});

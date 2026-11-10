import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractDestructiveConfirmation,
  extractServiceProposal,
  extractSongProposal,
} from "../src/proposals/parse.js";

describe("extractDestructiveConfirmation", () => {
  it("parses object and JSON-string payloads", () => {
    const payload = {
      confirmation: {
        action: "delete_song",
        id: "s1",
        title: "Hello",
        detail: "remove it",
      },
    };
    assert.deepEqual(extractDestructiveConfirmation(payload), {
      action: "delete_song",
      id: "s1",
      title: "Hello",
      detail: "remove it",
      folderAction: undefined,
    });
    assert.equal(extractDestructiveConfirmation(JSON.stringify(payload))?.id, "s1");
  });

  it("falls back title to id and accepts folderAction", () => {
    assert.deepEqual(
      extractDestructiveConfirmation({
        confirmation: {
          action: "delete_folder",
          id: "f1",
          title: "  ",
          folderAction: "move_to_root",
        },
      }),
      {
        action: "delete_folder",
        id: "f1",
        title: "f1",
        detail: undefined,
        folderAction: "move_to_root",
      },
    );
  });

  it("rejects invalid payloads", () => {
    assert.equal(extractDestructiveConfirmation(null), null);
    assert.equal(extractDestructiveConfirmation("not-json"), null);
    assert.equal(
      extractDestructiveConfirmation({ confirmation: { action: "nope", id: "1" } }),
      null,
    );
    assert.equal(extractDestructiveConfirmation({ confirmation: { action: "delete_song" } }), null);
  });
});

describe("extractSongProposal", () => {
  it("requires proposal.content and optionally carries diff preview", () => {
    assert.deepEqual(
      extractSongProposal({
        proposal: { id: "s1", content: "{title: A}", title: "A", artist: "B" },
        diff: { preview: "+A" },
      }),
      {
        id: "s1",
        content: "{title: A}",
        title: "A",
        artist: "B",
        diffPreview: "+A",
      },
    );
    assert.equal(extractSongProposal({ content: "raw" }), null);
    assert.equal(extractSongProposal({ proposal: { content: 1 } }), null);
    assert.equal(extractSongProposal("bad"), null);
  });
});

describe("extractServiceProposal", () => {
  it("requires proposal.elements array", () => {
    assert.deepEqual(
      extractServiceProposal({
        proposal: {
          id: "svc1",
          name: "Sunday",
          notes: "n",
          elements: [{ type: "song" }],
        },
      }),
      {
        serviceId: "svc1",
        name: "Sunday",
        notes: "n",
        elements: [{ type: "song" }],
      },
    );
    assert.equal(extractServiceProposal({ proposal: { name: "x" } }), null);
    assert.deepEqual(
      extractServiceProposal(JSON.stringify({ proposal: { elements: [] } }))?.elements,
      [],
    );
  });
});

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import type { PageContextSnapshot } from "../src/types/index.js";
import { maybeStageProposal } from "../src/proposals/stage.js";
import { aiProposals } from "../src/proposals/store.js";

const page = (partial: Partial<PageContextSnapshot> = {}): PageContextSnapshot =>
  ({
    songId: "song-page",
    serviceId: "svc-page",
    title: "Page Title",
    ...partial,
  }) as PageContextSnapshot;

describe("maybeStageProposal", () => {
  beforeEach(() => aiProposals.resolveAll());

  it("stages a song proposal using payload id and tool source", () => {
    maybeStageProposal(
      "songs_propose",
      { proposal: { id: "s1", content: "{title: One}", title: "One" } },
      page(),
    );
    const all = aiProposals.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].kind === "song" && all[0].entityId, "s1");
    assert.equal(all[0].kind === "song" && all[0].content, "{title: One}");
    assert.equal(all[0].source, "songs_propose");
  });

  it("falls back to page.songId when proposal omits id", () => {
    maybeStageProposal(
      "songs_propose",
      { proposal: { content: "{title: Page}" } },
      page({ title: "From Page" }),
    );
    const all = aiProposals.getAll();
    assert.equal(all[0].kind === "song" && all[0].entityId, "song-page");
    assert.equal(all[0].kind === "song" && all[0].title, "From Page");
  });

  it("skips song staging without any song id", () => {
    maybeStageProposal(
      "songs_propose",
      { proposal: { content: "{title: X}" } },
      page({ songId: undefined }),
    );
    assert.equal(aiProposals.getAll().length, 0);
  });

  it("stages a service proposal and ignores unrelated outputs", () => {
    maybeStageProposal(
      "services_propose",
      {
        proposal: {
          id: "svc1",
          name: "Sunday",
          elements: [{ id: "e1" }],
        },
      },
      page(),
    );
    assert.equal(aiProposals.getAll().length, 1);
    assert.equal(aiProposals.getAll()[0].kind, "service");

    aiProposals.resolveAll();
    maybeStageProposal("noop", { ok: true }, page());
    assert.equal(aiProposals.getAll().length, 0);
  });
});

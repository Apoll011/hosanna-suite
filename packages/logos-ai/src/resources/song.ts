/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { musicAppId } from "../kernel/capabilities";
import { songPath } from "./paths";
import type { ResourceDefinition, StagedProposal } from "./types";
import type { CatalogSong } from "../catalog/types";

function asRecord(output: unknown): Record<string, unknown> | null {
  let parsed: unknown = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

export const songResource: ResourceDefinition<"song"> = {
  kind: "song",
  domainId: "music.song",
  ownerApp: (profile) => musicAppId(profile),
  pathFor: songPath,
  extractProposal: (output) => {
    const obj = asRecord(output);
    if (!obj) return null;
    const proposal = obj.proposal as Record<string, unknown> | undefined;
    const content = proposal?.content;
    if (!content || typeof content !== "string") return null;
    return {
      entityId: typeof proposal?.id === "string" ? proposal.id : "",
      payload: { content, artist: proposal?.artist },
      title: typeof proposal?.title === "string" ? proposal.title : undefined,
      subtitle: typeof proposal?.artist === "string" ? proposal.artist : undefined,
    };
  },
  toPatch: (proposal) => {
    const payload = proposal.payload as { content: string };
    return { content: payload.content };
  },
  fingerprint: (proposal) => {
    const payload = proposal.payload as { content: string };
    return payload.content;
  },
  label: (entity, proposal) =>
    proposal.title || (entity as CatalogSong | null | undefined)?.title || "Untitled",
};

/** Normalize staged song into tray shape helpers. */
export function songContentOf(proposal: StagedProposal): string {
  return (proposal.payload as { content: string }).content;
}

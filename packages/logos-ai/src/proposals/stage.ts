/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogosServiceElement } from "../host/types";
import type { PageContextSnapshot } from "../types";
import { extractServiceProposal, extractSongProposal } from "./parse";
import { aiProposals } from "./store";

/** Stage song/service proposals from a completed tool output. */
export function maybeStageProposal(
  toolName: string,
  output: unknown,
  page: PageContextSnapshot,
): void {
  const song = extractSongProposal(output);
  if (song) {
    const songId = song.id ?? page.songId;
    if (songId) {
      aiProposals.stageSong({
        songId,
        content: song.content,
        title: song.title ?? page.title,
        artist: song.artist,
        source: toolName,
      });
    }
    return;
  }

  const service = extractServiceProposal(output);
  if (!service) return;
  const serviceId = service.serviceId ?? page.serviceId;
  if (!serviceId) return;

  aiProposals.stageService({
    serviceId,
    name: service.name,
    notes: service.notes,
    elements: service.elements as LogosServiceElement[],
    source: toolName,
  });
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseChordPro } from "@hosanna/chordpro";
import { useCallback } from "react";
import { dispatchAiNavigate } from "../core/bridge";
import { useHostUpdateSong, type LogosSong } from "../host";
import { aiProposals, type AiProposal, type SongProposal } from "./store";

/** Persist a song proposal directly (no editor needed) and clear it. */
export function useProposalActions() {
  const updateSong = useHostUpdateSong();

  const applySong = useCallback(
    async (proposal: SongProposal, content?: string): Promise<boolean> => {
      const next = content ?? proposal.content;
      const meta = parseChordPro(next).metadata;
      const data: Partial<LogosSong> = { content: next };
      if (meta.title) data.title = meta.title;
      if (meta.artist) data.artist = meta.artist;
      if (meta.songNumber && Number(meta.songNumber)) {
        data.song_number = Number(meta.songNumber);
      }
      try {
        // Success / error toasts are raised by the mutation itself.
        await updateSong({ id: proposal.entityId, data });
        aiProposals.resolve(proposal.key, "accepted");
        return true;
      } catch {
        return false;
      }
    },
    [updateSong],
  );

  const decline = useCallback((proposal: AiProposal) => {
    aiProposals.resolve(proposal.key);
  }, []);

  const openInEditor = useCallback((proposal: AiProposal) => {
    dispatchAiNavigate({ kind: proposal.kind, id: proposal.entityId });
  }, []);

  return { applySong, decline, openInEditor };
}

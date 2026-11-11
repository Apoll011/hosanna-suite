/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseChordPro } from "@hosanna/chordpro";
import { useCallback } from "react";
import { dispatchAiNavigate, dispatchAiOpenApp } from "../core/bridge";
import { studioPathForNavigate } from "../core/bridge/studioPaths";
import { hasCapability, musicAppId, planningAppId } from "../host/capabilities";
import { useCatalogUpdateSong } from "../host/catalog";
import { useLogosHost } from "../host/context";
import type { LogosSong } from "../host/types";
import { aiProposals, type AiProposal, type SongProposal } from "./store";

/** Persist a song proposal (API catalog or host adapter) and clear it. */
export function useProposalActions() {
  const host = useLogosHost();
  const updateSong = useCatalogUpdateSong();

  const applySong = useCallback(
    async (proposal: SongProposal, content?: string): Promise<boolean> => {
      if (!host.canUpdateSong) return false;
      const next = content ?? proposal.content;
      const meta = parseChordPro(next).metadata;
      const data: Partial<LogosSong> = { content: next };
      if (meta.title) data.title = meta.title;
      if (meta.artist) data.artist = meta.artist;
      if (meta.songNumber && Number(meta.songNumber)) {
        data.song_number = Number(meta.songNumber);
      }
      try {
        await updateSong({ id: proposal.entityId, data });
        aiProposals.resolve(proposal.key, "accepted");
        return true;
      } catch {
        return false;
      }
    },
    [host.canUpdateSong, updateSong],
  );

  const decline = useCallback((proposal: AiProposal) => {
    aiProposals.resolve(proposal.key);
  }, []);

  /**
   * Open the entity in an editor.
   * Local navigate when the host has an editor; otherwise open Music/Planning.
   */
  const openInEditor = useCallback(
    (proposal: AiProposal) => {
      const detail = { kind: proposal.kind, id: proposal.entityId };
      const canLocal =
        (proposal.kind === "song" &&
          (hasCapability(host.profile, "editor.songs") ||
            hasCapability(host.profile, "navigate.local"))) ||
        (proposal.kind === "service" &&
          (hasCapability(host.profile, "editor.services") ||
            hasCapability(host.profile, "navigate.local")));

      if (canLocal) {
        dispatchAiNavigate(detail);
        return;
      }

      const path = studioPathForNavigate(detail, host.slugPrefix);
      const app =
        proposal.kind === "service" ? planningAppId(host.profile) : musicAppId(host.profile);
      dispatchAiOpenApp({
        app,
        path,
        openIn: "same",
        reason: "review-proposal",
      });
    },
    [host.profile, host.slugPrefix],
  );

  return { applySong, decline, openInEditor };
}

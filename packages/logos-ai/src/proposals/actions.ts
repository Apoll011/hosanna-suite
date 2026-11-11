/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseChordPro } from "@hosanna/chordpro";
import { useCallback } from "react";
import { dispatchAiNavigate, dispatchAiOpenApp } from "../core/bridge";
import { studioPathForNavigate, studioPathForPrint } from "../core/bridge/studioPaths";
import type { AiHostUiOffer } from "./parse";
import { hasCapability, musicAppId, planningAppId } from "../host/capabilities";
import { useCatalogUpdateService, useCatalogUpdateSong } from "../host/catalog";
import { useLogosHost } from "../host/context";
import type { LogosSong } from "../host/types";
import { aiProposals, type AiProposal, type ServiceProposal, type SongProposal } from "./store";

/** Persist proposals and optional cross-app opens (never auto — user-driven). */
export function useProposalActions() {
  const host = useLogosHost();
  const updateSong = useCatalogUpdateSong();
  const updateService = useCatalogUpdateService();

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

  const applyService = useCallback(
    async (proposal: ServiceProposal): Promise<boolean> => {
      if (!host.canUpdateService) return false;
      try {
        await updateService({
          id: proposal.entityId,
          data: {
            elements: proposal.elements,
            ...(proposal.name ? { name: proposal.name } : {}),
            ...(proposal.notes != null ? { notes: proposal.notes } : {}),
          },
        });
        aiProposals.resolve(proposal.key, "accepted");
        return true;
      } catch {
        return false;
      }
    },
    [host.canUpdateService, updateService],
  );

  const decline = useCallback((proposal: AiProposal) => {
    aiProposals.resolve(proposal.key);
  }, []);

  /**
   * Optional: open the entity in an editor / Music.
   * Never required for Accept — proposals stay reviewable in chat.
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

  /** Run a deferred navigate/print offer from a thin-host chat card. */
  const runHostUiOffer = useCallback(
    (offer: AiHostUiOffer) => {
      if (offer.type === "navigate") {
        const detail = {
          kind: offer.kind,
          id: offer.id ?? null,
          route: offer.route,
          reason: offer.reason,
        };
        if (hasCapability(host.profile, "navigate.local")) {
          dispatchAiNavigate(detail);
          return;
        }
        const path = studioPathForNavigate(detail, host.slugPrefix);
        const app =
          offer.kind === "service" || offer.kind === "services" || offer.kind === "agenda"
            ? planningAppId(host.profile)
            : musicAppId(host.profile);
        dispatchAiOpenApp({
          app,
          path,
          openIn: "same",
          reason: offer.reason ?? "open",
        });
        return;
      }

      const printDetail = {
        kind: offer.kind,
        ids: offer.ids ?? [],
        title: offer.title,
        reason: offer.reason,
      };
      if (hasCapability(host.profile, "print")) {
        // Print is Studio-local; thin hosts open the entity instead.
        return;
      }
      dispatchAiOpenApp({
        app: musicAppId(host.profile),
        path: studioPathForPrint(printDetail, host.slugPrefix),
        openIn: "same",
        reason: offer.reason ?? "print",
      });
    },
    [host.profile, host.slugPrefix],
  );

  return { applySong, applyService, decline, openInEditor, runHostUiOffer };
}

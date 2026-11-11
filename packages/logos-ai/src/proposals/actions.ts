/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from "react";
import { runDeferredOffer } from "../actions/dispatch";
import type { DeferredHostOffer } from "../actions/types";
import { useApplyProposal } from "../catalog/hooks";
import { dispatchAiNavigate, dispatchAiOpenApp } from "../core/bridge";
import { hasCapability } from "../kernel/capabilities";
import { useLogosHost } from "../host/context";
import { getResource } from "../resources/registry";
import { aiProposals, type AiProposal, type ServiceProposal, type SongProposal } from "./store";

function toStaged(proposal: AiProposal) {
  if (proposal.kind === "song") {
    return {
      kind: "song" as const,
      entityId: proposal.entityId,
      payload: { content: proposal.content, artist: proposal.artist },
      title: proposal.title,
      subtitle: proposal.artist,
      source: proposal.source,
    };
  }
  return {
    kind: "service" as const,
    entityId: proposal.entityId,
    payload: {
      elements: proposal.elements,
      name: proposal.name,
      notes: proposal.notes,
    },
    title: proposal.name,
    source: proposal.source,
  };
}

/** Persist proposals + optional cross-app opens (user-driven only). */
export function useProposalActions() {
  const host = useLogosHost();
  const applyProposal = useApplyProposal();

  const applySong = useCallback(
    async (proposal: SongProposal, content?: string): Promise<boolean> => {
      const staged = toStaged({
        ...proposal,
        content: content ?? proposal.content,
      });
      const ok = await applyProposal(staged);
      if (ok) aiProposals.resolve(proposal.key, "accepted");
      return ok;
    },
    [applyProposal],
  );

  const applyService = useCallback(
    async (proposal: ServiceProposal): Promise<boolean> => {
      const ok = await applyProposal(toStaged(proposal));
      if (ok) aiProposals.resolve(proposal.key, "accepted");
      return ok;
    },
    [applyProposal],
  );

  const decline = useCallback((proposal: AiProposal) => {
    aiProposals.resolve(proposal.key);
  }, []);

  const openInEditor = useCallback(
    (proposal: AiProposal) => {
      const resource = getResource(proposal.kind);
      const canLocal =
        (proposal.kind === "song" &&
          (hasCapability(host.profile, "editor.songs") ||
            hasCapability(host.profile, "navigate.local"))) ||
        (proposal.kind === "service" &&
          (hasCapability(host.profile, "editor.services") ||
            hasCapability(host.profile, "navigate.local")));

      if (canLocal) {
        dispatchAiNavigate({ kind: proposal.kind, id: proposal.entityId });
        return;
      }

      dispatchAiOpenApp({
        app: resource.ownerApp(host.profile),
        path: resource.pathFor(proposal.entityId, host.slugPrefix),
        openIn: "same",
        reason: "review-proposal",
      });
    },
    [host.profile, host.slugPrefix],
  );

  const runHostUiOffer = useCallback(
    (offer: DeferredHostOffer | { type: string; [k: string]: unknown }) => {
      // Accept legacy AiHostUiOffer shape from older cards.
      if (offer.type === "navigate" && "navigate" in offer) {
        runDeferredOffer(offer as DeferredHostOffer, host);
        return;
      }
      if (offer.type === "print" && "print" in offer) {
        runDeferredOffer(offer as DeferredHostOffer, host);
        return;
      }
      if (offer.type === "navigate") {
        runDeferredOffer(
          {
            type: "navigate",
            navigate: {
              kind: String((offer as { kind?: string }).kind ?? "song"),
              id: (offer as { id?: string | null }).id ?? null,
              route: (offer as { route?: string }).route,
              reason: (offer as { reason?: string }).reason,
            },
          },
          host,
        );
        return;
      }
      if (offer.type === "print") {
        runDeferredOffer(
          {
            type: "print",
            print: {
              kind: String((offer as { kind?: string }).kind ?? "song"),
              ids: ((offer as { ids?: string[] }).ids ?? []).filter(Boolean),
              title: (offer as { title?: string }).title,
              reason: (offer as { reason?: string }).reason,
            },
          },
          host,
        );
      }
    },
    [host],
  );

  return { applySong, applyService, decline, openInEditor, runHostUiOffer };
}

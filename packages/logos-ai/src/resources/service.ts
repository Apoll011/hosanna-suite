/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { planningAppId } from "../kernel/capabilities";
import type { CatalogService, CatalogServiceElement } from "../catalog/types";
import { servicePath } from "./paths";
import type { ResourceDefinition, StagedProposal } from "./types";

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

export type ServiceProposalPayload = {
  elements: CatalogServiceElement[];
  name?: string;
  notes?: string;
};

export const serviceResource: ResourceDefinition<"service"> = {
  kind: "service",
  ownerApp: (profile) => planningAppId(profile),
  pathFor: servicePath,
  extractProposal: (output) => {
    const obj = asRecord(output);
    if (!obj) return null;
    const proposal = obj.proposal as Record<string, unknown> | undefined;
    if (!proposal?.elements || !Array.isArray(proposal.elements)) return null;
    return {
      entityId: typeof proposal.id === "string" ? proposal.id : "",
      payload: {
        elements: proposal.elements as CatalogServiceElement[],
        name: typeof proposal.name === "string" ? proposal.name : undefined,
        notes: typeof proposal.notes === "string" ? proposal.notes : undefined,
      } satisfies ServiceProposalPayload,
      title: typeof proposal.name === "string" ? proposal.name : undefined,
    };
  },
  toPatch: (proposal) => {
    const payload = proposal.payload as ServiceProposalPayload;
    return {
      elements: payload.elements,
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.notes != null ? { notes: payload.notes } : {}),
    };
  },
  fingerprint: (proposal) =>
    JSON.stringify((proposal.payload as ServiceProposalPayload).elements),
  label: (entity, proposal) =>
    proposal.title || (entity as CatalogService | null | undefined)?.name || "Untitled",
};

export function serviceElementsOf(proposal: StagedProposal): CatalogServiceElement[] {
  return (proposal.payload as ServiceProposalPayload).elements;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Compatibility wrappers around the action/resource parsers.
 */

import { parseToolActions, unwrapToolJson } from "../actions/parse";
import type { LogosConfirmAction } from "../actions/types";
import { songResource } from "../resources/song";
import { serviceResource } from "../resources/service";

export type AiDestructiveConfirmation = LogosConfirmAction;

export function extractDestructiveConfirmation(output: unknown): AiDestructiveConfirmation | null {
  const actions = parseToolActions("tool", output);
  const confirm = actions.find((a) => a.type === "confirm");
  return confirm && confirm.type === "confirm" ? confirm.confirmation : null;
}

export function extractSongProposal(output: unknown): {
  id?: string;
  content: string;
  title?: string;
  artist?: string;
  diffPreview?: string;
} | null {
  const body =
    unwrapToolJson(output) ??
    (typeof output === "object" ? (output as Record<string, unknown>) : null);
  if (!body) return null;
  const extracted = songResource.extractProposal(body);
  if (!extracted) return null;
  const payload = extracted.payload as { content: string; artist?: string };
  const obj = body as { diff?: { preview?: string } };
  return {
    id: extracted.entityId || undefined,
    content: payload.content,
    title: extracted.title,
    artist: typeof payload.artist === "string" ? payload.artist : extracted.subtitle,
    diffPreview: typeof obj.diff?.preview === "string" ? obj.diff.preview : undefined,
  };
}

export function extractServiceProposal(output: unknown): {
  serviceId?: string;
  name?: string;
  notes?: string;
  elements: unknown[];
} | null {
  const body =
    unwrapToolJson(output) ??
    (typeof output === "object" ? (output as Record<string, unknown>) : null);
  if (!body) return null;
  const extracted = serviceResource.extractProposal(body);
  if (!extracted) return null;
  const payload = extracted.payload as {
    elements: unknown[];
    name?: string;
    notes?: string;
  };
  return {
    serviceId: extracted.entityId || undefined,
    name: payload.name,
    notes: payload.notes,
    elements: payload.elements,
  };
}

/** @deprecated Prefer DeferredHostOffer from actions. */
export type AiHostUiOffer = {
  type: "navigate" | "print";
  kind: string;
  id?: string | null;
  ids?: string[];
  route?: string;
  title?: string;
  reason?: string;
};

export function extractHostUiOffer(output: unknown): AiHostUiOffer | null {
  const actions = parseToolActions("tool", output);
  for (const action of actions) {
    if (action.type === "navigate") {
      return {
        type: "navigate",
        kind: action.navigate.kind,
        id: action.navigate.id,
        route: action.navigate.route,
        reason: action.navigate.reason,
      };
    }
    if (action.type === "print") {
      return {
        type: "print",
        kind: action.print.kind,
        ids: action.print.ids,
        title: action.print.title,
        reason: action.print.reason,
      };
    }
  }
  return null;
}

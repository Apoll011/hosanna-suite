/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { listResources } from "../resources/registry";
import type {
  ActionPageContext,
  LogosAction,
  LogosConfirmAction,
  DeferredHostOffer,
} from "./types";

function asRecord(output: unknown): Record<string, unknown> | null {
  if (output == null) return null;
  if (typeof output === "object" && !Array.isArray(output)) {
    return output as Record<string, unknown>;
  }
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Unwrap AI SDK / MCP-style envelopes. */
export function unwrapToolJson(output: unknown): Record<string, unknown> | null {
  const direct = asRecord(output);
  if (!direct) return null;
  if (typeof direct.text === "string") return unwrapToolJson(direct.text) ?? direct;
  if (Array.isArray(direct.content)) {
    const text = (direct.content as Array<{ type?: string; text?: string }>)
      .map((c) => (c?.type === "text" ? (c.text ?? "") : ""))
      .join("");
    if (text) return unwrapToolJson(text) ?? direct;
  }
  return direct;
}

const CONFIRM_ACTIONS = new Set([
  "delete_song",
  "delete_service",
  "delete_folder",
  "delete_collection",
  "delete_agenda",
]);

function extractConfirm(body: Record<string, unknown>): LogosConfirmAction | null {
  const confirmation = body.confirmation as Record<string, unknown> | undefined;
  if (!confirmation || typeof confirmation !== "object") return null;
  const action = confirmation.action;
  const id = confirmation.id;
  if (typeof action !== "string" || typeof id !== "string") return null;
  if (!CONFIRM_ACTIONS.has(action)) return null;
  return {
    action: action as LogosConfirmAction["action"],
    id,
    title:
      typeof confirmation.title === "string" && confirmation.title.trim() ? confirmation.title : id,
    detail: typeof confirmation.detail === "string" ? confirmation.detail : undefined,
    folderAction:
      confirmation.folderAction === "delete_songs" || confirmation.folderAction === "move_to_root"
        ? confirmation.folderAction
        : undefined,
  };
}

/**
 * Parse one tool output into zero-or-more Logos actions.
 * Resource proposals come from the registry — add a resource, get parsing free.
 */
export function parseToolActions(
  toolName: string,
  output: unknown,
  page?: ActionPageContext,
): LogosAction[] {
  const body = unwrapToolJson(output);
  if (!body) return [];
  const actions: LogosAction[] = [];

  for (const resource of listResources()) {
    const extracted = resource.extractProposal(body);
    if (!extracted) continue;
    let entityId = extracted.entityId;
    if (!entityId) {
      entityId =
        resource.kind === "song"
          ? (page?.songId ?? "")
          : resource.kind === "service"
            ? (page?.serviceId ?? "")
            : "";
    }
    if (!entityId) continue;
    actions.push({
      type: "propose",
      toolName,
      proposal: {
        kind: resource.kind,
        entityId,
        payload: extracted.payload,
        title: extracted.title ?? (resource.kind === "song" ? page?.title : undefined),
        subtitle: extracted.subtitle,
        source: toolName,
      },
    });
    // A tool result is either a song or service proposal, not both.
    break;
  }

  const confirm = extractConfirm(body);
  if (confirm) actions.push({ type: "confirm", confirmation: confirm });

  if (
    (body.studioNavigate === true || body.hostNavigate === true) &&
    typeof body.kind === "string"
  ) {
    actions.push({
      type: "navigate",
      navigate: {
        kind: body.kind,
        id: typeof body.id === "string" ? body.id : ((body.id as null) ?? null),
        route: typeof body.route === "string" ? body.route : undefined,
        reason: typeof body.reason === "string" ? body.reason : undefined,
      },
    });
  }

  if (
    (body.studioPrint === true || body.hostPrint === true) &&
    typeof body.kind === "string" &&
    Array.isArray(body.ids)
  ) {
    const ids = body.ids.filter((id): id is string => typeof id === "string");
    if (ids.length) {
      actions.push({
        type: "print",
        print: {
          kind: body.kind,
          ids,
          title: typeof body.title === "string" ? body.title : undefined,
          reason: typeof body.reason === "string" ? body.reason : undefined,
          options:
            body.options && typeof body.options === "object"
              ? (body.options as Record<string, unknown>)
              : undefined,
        },
      });
    }
  }

  if (body.studioSync === true) {
    actions.push({
      type: "sync",
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
  }

  if (body.openApp === true && typeof body.app === "string") {
    actions.push({
      type: "openApp",
      openApp: {
        app: body.app,
        path: typeof body.path === "string" ? body.path : "/",
        openIn: body.openIn === "new" ? "new" : "same",
        reason: typeof body.reason === "string" ? body.reason : undefined,
      },
    });
  }

  return actions;
}

/** Offers shown as chat cards on thin hosts (navigate/print without local UX). */
export function asDeferredOffer(action: LogosAction): DeferredHostOffer | null {
  if (action.type === "navigate") return { type: "navigate", navigate: action.navigate };
  if (action.type === "print") return { type: "print", print: action.print };
  return null;
}

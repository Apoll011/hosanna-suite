/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiDestructiveConfirmation = {
  action:
    "delete_song" | "delete_service" | "delete_folder" | "delete_collection" | "delete_agenda";
  id: string;
  title: string;
  detail?: string;
  folderAction?: "move_to_root" | "delete_songs";
};

/** Extract a destructive Confirm-card payload from a tool result. */
export function extractDestructiveConfirmation(output: unknown): AiDestructiveConfirmation | null {
  let parsed: unknown = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const confirmation = (parsed as { confirmation?: Record<string, unknown> }).confirmation;
  if (!confirmation || typeof confirmation !== "object") return null;
  const action = confirmation.action;
  const id = confirmation.id;
  const title = confirmation.title;
  if (typeof action !== "string" || typeof id !== "string") return null;
  if (
    ![
      "delete_song",
      "delete_service",
      "delete_folder",
      "delete_collection",
      "delete_agenda",
    ].includes(action)
  ) {
    return null;
  }
  return {
    action: action as AiDestructiveConfirmation["action"],
    id,
    title: typeof title === "string" && title.trim() ? title : id,
    detail: typeof confirmation.detail === "string" ? confirmation.detail : undefined,
    folderAction:
      confirmation.folderAction === "delete_songs" || confirmation.folderAction === "move_to_root"
        ? confirmation.folderAction
        : undefined,
  };
}

/** Extract a ChordPro/song proposal payload from a tool result. */
export function extractSongProposal(output: unknown): {
  id?: string;
  content: string;
  title?: string;
  artist?: string;
  diffPreview?: string;
} | null {
  let parsed: unknown = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as {
    proposal?: {
      id?: string;
      content?: string;
      title?: string;
      artist?: string;
    };
    content?: string;
    diff?: { preview?: string };
  };
  // Only stage intentional proposals (not raw songs.get / parse payloads).
  const content = obj.proposal?.content;
  if (!content || typeof content !== "string") return null;
  return {
    id: obj.proposal?.id,
    content,
    title: obj.proposal?.title,
    artist: obj.proposal?.artist,
    diffPreview: typeof obj.diff?.preview === "string" ? obj.diff.preview : undefined,
  };
}

export function extractServiceProposal(output: unknown): {
  serviceId?: string;
  name?: string;
  notes?: string;
  elements: unknown[];
} | null {
  let parsed: unknown = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const proposal = (parsed as { proposal?: Record<string, unknown> }).proposal;
  if (!proposal?.elements || !Array.isArray(proposal.elements)) return null;
  return {
    serviceId: typeof proposal.id === "string" ? proposal.id : undefined,
    name: typeof proposal.name === "string" ? proposal.name : undefined,
    notes: typeof proposal.notes === "string" ? proposal.notes : undefined,
    elements: proposal.elements,
  };
}

/** Optional navigate/print offer for thin hosts (chat stays put until the user clicks). */
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
  let parsed: unknown = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const body = parsed as Record<string, unknown>;

  if (
    (body.studioNavigate === true || body.hostNavigate === true) &&
    typeof body.kind === "string"
  ) {
    return {
      type: "navigate",
      kind: body.kind,
      id: typeof body.id === "string" ? body.id : ((body.id as null) ?? null),
      route: typeof body.route === "string" ? body.route : undefined,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    };
  }

  if (
    (body.studioPrint === true || body.hostPrint === true) &&
    typeof body.kind === "string" &&
    Array.isArray(body.ids)
  ) {
    const ids = body.ids.filter((id): id is string => typeof id === "string");
    if (!ids.length) return null;
    return {
      type: "print",
      kind: body.kind,
      ids,
      title: typeof body.title === "string" ? body.title : undefined,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    };
  }

  return null;
}

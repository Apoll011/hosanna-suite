/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PageContextSnapshot } from "../../types";
import { aiContextBridge } from "./contextBridge";

export const EXCERPT_MAX = 12_000;

export function buildPageContext(
  pathname: string,
  slugPrefix: string,
  params: { id?: string },
  deriveView: (pathname: string, slugPrefix: string) => string,
  /** `false` skips heavy editor content (used for the live header/chips). */
  withContent = true,
): PageContextSnapshot {
  const view = deriveView(pathname, slugPrefix);
  const songBridge = aiContextBridge.getSong();
  const serviceBridge = aiContextBridge.getService();
  const explorer = aiContextBridge.getExplorer();

  if (view === "song-editor") {
    const full = withContent ? (songBridge?.content ?? "") : "";
    const truncated = full.length > EXCERPT_MAX;
    return {
      kind: "song_editor",
      route: pathname,
      songId: params.id ?? songBridge?.songId,
      title: songBridge?.title,
      artist: songBridge?.artist,
      updatedAt: songBridge?.updatedAt,
      folderId: songBridge?.folderId ?? explorer?.folderId ?? null,
      contentExcerpt: truncated ? full.slice(0, EXCERPT_MAX) : full || undefined,
      contentTruncated: truncated || undefined,
    };
  }
  if (view === "service-editor") {
    const summary =
      serviceBridge?.elements.map((el) => ({
        id: el.id,
        type: el.type,
        title: el.title,
        songId: el.songId,
      })) ?? [];
    const excerpt =
      withContent && serviceBridge
        ? JSON.stringify(
            {
              name: serviceBridge.title,
              date: serviceBridge.date,
              notes: serviceBridge.notes,
              elements: summary,
            },
            null,
            2,
          )
        : undefined;
    const truncated = Boolean(excerpt && excerpt.length > EXCERPT_MAX);
    return {
      kind: "service_editor",
      route: pathname,
      serviceId: params.id ?? serviceBridge?.serviceId,
      title: serviceBridge?.title,
      updatedAt: serviceBridge?.updatedAt,
      contentExcerpt: truncated ? excerpt!.slice(0, EXCERPT_MAX) : excerpt,
      contentTruncated: truncated || undefined,
      serviceElementsSummary: summary,
    };
  }
  if (view === "songs") {
    return {
      kind: "songs_list",
      route: pathname,
      folderId: explorer?.folderId ?? null,
      selectedSongIds: explorer?.selectedSongIds,
      selectedFolderIds: explorer?.selectedFolderIds,
    };
  }
  if (view === "services") return { kind: "services_list", route: pathname };
  if (view === "collection-detail") {
    return {
      kind: "collection_detail",
      route: pathname,
      collectionId: explorer?.collectionId ?? params.id ?? null,
      selectedSongIds: explorer?.selectedSongIds,
    };
  }
  if (view === "agenda") return { kind: "agenda", route: pathname };
  if (view === "trash") return { kind: "trash", route: pathname };
  if (view === "explorer") {
    return {
      kind: "explorer",
      route: pathname,
      folderId: explorer?.folderId ?? null,
      selectedSongIds: explorer?.selectedSongIds,
      selectedFolderIds: explorer?.selectedFolderIds,
    };
  }
  return {
    kind: "general",
    route: pathname,
    folderId: explorer?.folderId ?? null,
    collectionId: explorer?.collectionId ?? null,
    selectedSongIds: explorer?.selectedSongIds,
    selectedFolderIds: explorer?.selectedFolderIds,
  };
}

/** Stable fingerprint of the cheap page context (no editor content). */
export function contextKey(ctx: PageContextSnapshot): string {
  return JSON.stringify([
    ctx.kind,
    ctx.route,
    ctx.songId,
    ctx.serviceId,
    ctx.folderId,
    ctx.collectionId,
    ctx.title,
    ctx.artist,
    ctx.selectedSongIds?.length ?? 0,
    ctx.selectedFolderIds?.length ?? 0,
  ]);
}

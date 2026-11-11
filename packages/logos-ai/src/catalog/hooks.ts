/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseChordPro } from "@hosanna/chordpro";
import { useCallback, useEffect, useState } from "react";
import { useLogosHost } from "../host/context";
import { hasCapability } from "../kernel/capabilities";
import { getResource } from "../resources/registry";
import type { ResourceKind, StagedProposal } from "../resources/types";
import { useHostSong, useHostUpdateSong, useLogosSongAdapter } from "../host/songAdapter";
import type { CatalogResourceMap, CatalogSong } from "./types";

export type CatalogResourceState<K extends ResourceKind> = {
  data: CatalogResourceMap[K] | null | undefined;
  isLoading: boolean;
  notFound: boolean;
};

/** Load any registered resource for proposal UI. */
export function useCatalogResource<K extends ResourceKind>(
  kind: K,
  id: string | null | undefined,
): CatalogResourceState<K> {
  const { catalog, profile } = useLogosHost();
  const [remote, setRemote] = useState<CatalogResourceMap[K] | null | undefined>(undefined);
  const [remoteLoading, setRemoteLoading] = useState(false);

  // Song: prefer Studio RxDB adapter when present.
  const useLocalSong = kind === "song";
  // Hooks must be unconditional — adapter throws if missing; providers always mount one.
  useLogosSongAdapter();
  const localSong = useHostSong(useLocalSong ? id : null);

  useEffect(() => {
    setRemote(undefined);
  }, [kind, id]);

  useEffect(() => {
    if (!id) {
      setRemote(undefined);
      setRemoteLoading(false);
      return;
    }
    if (kind === "song" && localSong.data) {
      setRemote(localSong.data as CatalogResourceMap[K]);
      setRemoteLoading(false);
      return;
    }
    if (kind === "song" && localSong.isLoading) return;

    let cancelled = false;
    setRemoteLoading(true);
    void catalog
      .get(kind, id)
      .then((row) => {
        if (!cancelled) setRemote((row ?? null) as CatalogResourceMap[K] | null);
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id, catalog, localSong.data, localSong.isLoading]);

  const data =
    kind === "song" && localSong.data ? (localSong.data as CatalogResourceMap[K]) : remote;
  const isLoading =
    Boolean(id) &&
    (kind === "song"
      ? localSong.isLoading || (remoteLoading && !localSong.data && remote === undefined)
      : remoteLoading || remote === undefined);
  const notFound = Boolean(id) && !isLoading && !data;

  // silence unused profile (kept for future capability gates)
  void profile;

  return { data, isLoading, notFound };
}

/** Accept a staged proposal through catalog (or song adapter on Studio). */
export function useApplyProposal() {
  const { catalog, profile } = useLogosHost();
  const adapterUpdate = useHostUpdateSong();
  const preferSongAdapter = hasCapability(profile, "editor.songs");

  return useCallback(
    async (proposal: StagedProposal): Promise<boolean> => {
      if (!catalog.canUpdate(proposal.kind) && !(proposal.kind === "song" && preferSongAdapter)) {
        return false;
      }
      try {
        const resource = getResource(proposal.kind);
        let patch = resource.toPatch(proposal);

        if (proposal.kind === "song") {
          const content = (proposal.payload as { content: string }).content;
          const meta = parseChordPro(content).metadata;
          const songPatch = patch as Partial<CatalogSong>;
          if (meta.title) songPatch.title = meta.title;
          if (meta.artist) songPatch.artist = meta.artist;
          if (meta.songNumber && Number(meta.songNumber)) {
            songPatch.song_number = Number(meta.songNumber);
          }
          if (preferSongAdapter) {
            await adapterUpdate({ id: proposal.entityId, data: songPatch });
            return true;
          }
          await catalog.update("song", proposal.entityId, songPatch);
          return true;
        }

        await catalog.update(proposal.kind, proposal.entityId, patch);
        return true;
      } catch {
        return false;
      }
    },
    [catalog, preferSongAdapter, adapterUpdate],
  );
}

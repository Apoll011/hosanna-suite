/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { getDatabase } from "../db";
import { useAgenda } from "./useAgenda";
import { useFolders } from "./useFolders";
import { useServices } from "./useServices";
import { useSongs } from "./useSongs";

export interface TrashItem {
  id: string;
  type: "folder" | "song" | "service" | "agenda";
  name: string;
  updatedAt: string;
  purgeAt: string | null;
}

let cachedTrashMap = {
  folders: [] as TrashItem[],
  songs: [] as TrashItem[],
  services: [] as TrashItem[],
  agendaEvents: [] as TrashItem[],
};
let isTrashCached = false;

export function invalidateTrashCache(): void {
  cachedTrashMap = {
    folders: [],
    songs: [],
    services: [],
    agendaEvents: [],
  };
  isTrashCached = false;
}

function getCombinedTrashItems(): TrashItem[] {
  return [
    ...cachedTrashMap.folders,
    ...cachedTrashMap.songs,
    ...cachedTrashMap.services,
    ...cachedTrashMap.agendaEvents,
  ];
}

export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>(() =>
    isTrashCached ? getCombinedTrashItems() : [],
  );
  const [isLoading, setIsLoading] = useState(() => !isTrashCached);

  const { restoreFolder, isRestoring: isRestoringFolder } = useFolders();
  const { restoreSong, isRestoring: isRestoringSong } = useSongs();
  const { restoreService, isRestoring: isRestoringService } = useServices();
  const { restoreEvent, isRestoring: isRestoringEvent } = useAgenda();

  useEffect(() => {
    let isSubscribed = true;
    const subs: { unsubscribe: () => void }[] = [];

    async function subscribeTrash() {
      const db = await getDatabase();
      if (!isSubscribed) return;

      let receivedFolders = isTrashCached;
      let receivedSongs = isTrashCached;
      let receivedServices = isTrashCached;
      let receivedAgendaEvents = isTrashCached;

      const emit = () => {
        if (
          !receivedFolders ||
          !receivedSongs ||
          !receivedServices ||
          !receivedAgendaEvents
        ) {
          return;
        }
        isTrashCached = true;
        const allItems = getCombinedTrashItems();
        setItems(allItems);
        setIsLoading(false);
      };

      subs.push(
        db.folders
          .find({ selector: { isDeleted: true } })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            cachedTrashMap.folders = docs.map((d) => ({
              id: d.id,
              type: "folder" as const,
              name: d.name,
              updatedAt: d.updatedAt,
              purgeAt: d.purgeAt ?? null,
            }));
            receivedFolders = true;
            emit();
          }),
      );

      subs.push(
        db.songs.find({ selector: { isDeleted: true } }).$.subscribe((docs) => {
          if (!isSubscribed) return;
          cachedTrashMap.songs = docs.map((d) => ({
            id: d.id,
            type: "song" as const,
            name: d.title,
            updatedAt: d.updatedAt,
            purgeAt: d.purgeAt ?? null,
          }));
          receivedSongs = true;
          emit();
        }),
      );

      subs.push(
        db.services
          .find({ selector: { isDeleted: true } })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            cachedTrashMap.services = docs.map((d) => ({
              id: d.id,
              type: "service" as const,
              name: d.name,
              updatedAt: d.updatedAt,
              purgeAt: d.purgeAt ?? null,
            }));
            receivedServices = true;
            emit();
          }),
      );

      subs.push(
        db.agendaEvents
          .find({ selector: { isDeleted: true } })
          .$.subscribe((docs) => {
            if (!isSubscribed) return;
            cachedTrashMap.agendaEvents = docs.map((d) => ({
              id: d.id,
              type: "agenda" as const,
              name: d.title,
              updatedAt: d.updatedAt,
              purgeAt: d.purgeAt ?? null,
            }));
            receivedAgendaEvents = true;
            emit();
          }),
      );
    }

    void subscribeTrash();

    return () => {
      isSubscribed = false;
      subs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const restoreItem = async (item: TrashItem) => {
    if (item.type === "folder") await restoreFolder(item.id);
    else if (item.type === "song") await restoreSong(item.id);
    else if (item.type === "service") await restoreService(item.id);
    else await restoreEvent(item.id);
  };

  return {
    items,
    isLoading,
    restoreItem,
    isRestoring:
      isRestoringFolder ||
      isRestoringSong ||
      isRestoringService ||
      isRestoringEvent,
  };
}

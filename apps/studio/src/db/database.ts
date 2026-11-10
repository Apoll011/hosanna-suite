/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hosana Database — Studio domain wiring over `@hosanna/replication`.
 *
 * On first call the DB is opened and all docs are loaded into memory;
 * subsequent calls return the same already-resolved promise (singleton).
 */

import { parseChordPro } from "@hosanna/chordpro";
import { _registerResetDatabase, HosanaCollection, idbGetAll, openIDB } from "@hosanna/replication";
import {
  recalculateAllDerivedCounts,
  recalculateCollectionCounts,
  recalculateFolderCounts,
} from "./counts";
import { getMainDbName } from "./dbNames";
import { META_STORE } from "./orgScope";
import type {
  AgendaEventDocType,
  CollectionDocType,
  FolderDocType,
  ServiceDocType,
  SongDocType,
} from "./schemas";

// Bump this number whenever store structure changes (new indexes etc.).
// v2: collections store.
// v3: `meta` store — durable org-slug stamp for local data isolation.
// Note: Checkpoints are stored in a SEPARATE dedicated IDB ("hosana_checkpoints")
// so they survive even if the main data IDB is wiped.
// Demo/onboarding uses `hosana_idb_demo` via getMainDbName().
const DB_VERSION = 3;

const STORE_SONGS = "songs";
const STORE_FOLDERS = "folders";
const STORE_COLLECTIONS = "collections";
const STORE_SERVICES = "services";
const STORE_AGENDA = "agendaEvents";

// HosanaCollection<T> requires T extends AnyDoc = {id:string} & Record<string,unknown>.
// Our doc types have explicit fields but no index signature.
// We cast them to "T & Record<string,unknown>" so TypeScript accepts them as
// AnyDoc while preserving all the named field types on the collection's generic.

type AsSongDoc = SongDocType & Record<string, unknown>;
type AsFolderDoc = FolderDocType & Record<string, unknown>;
type AsCollectionDoc = CollectionDocType & Record<string, unknown>;
type AsServiceDoc = ServiceDocType & Record<string, unknown>;
type AsAgendaDoc = AgendaEventDocType & Record<string, unknown>;

export interface HosanaDatabaseCollections {
  songs: HosanaCollection<AsSongDoc>;
  folders: HosanaCollection<AsFolderDoc>;
  collections: HosanaCollection<AsCollectionDoc>;
  services: HosanaCollection<AsServiceDoc>;
  agendaEvents: HosanaCollection<AsAgendaDoc>;
}

export type HosanaDatabase = HosanaDatabaseCollections & {
  /** @internal underlying IndexedDB handle (meta store, health checks). */
  readonly _idb: IDBDatabase;
};

let dbPromise: Promise<HosanaDatabase> | null = null;

export async function getDatabase(): Promise<HosanaDatabase> {
  if (!dbPromise) {
    dbPromise = _open();
  }
  return dbPromise;
}

/**
 * Bust the DB singleton so the next `getDatabase()` call reopens IDB fresh.
 * Call this after deleting the IndexedDB (e.g. demo logout / wipe).
 */
export function resetDatabase(): void {
  dbPromise = null;
}

// Wire the idb layer back to this module so it can clear the singleton
// automatically when the IDB connection is closed (onversionchange / onclose).
_registerResetDatabase(resetDatabase);

async function _open(): Promise<HosanaDatabase> {
  const idb = await openIDB(getMainDbName(), DB_VERSION, (db, oldVersion) => {
    if (oldVersion < 1) {
      const songsStore = db.createObjectStore(STORE_SONGS, { keyPath: "id" });
      songsStore.createIndex("updatedAt", "updatedAt");
      songsStore.createIndex("folderId", "folderId");
      songsStore.createIndex("isDeleted", "isDeleted");
      songsStore.createIndex("path", "path");

      const foldersStore = db.createObjectStore(STORE_FOLDERS, {
        keyPath: "id",
      });
      foldersStore.createIndex("updatedAt", "updatedAt");
      foldersStore.createIndex("isDeleted", "isDeleted");
      foldersStore.createIndex("parentId", "parentId");

      const servicesStore = db.createObjectStore(STORE_SERVICES, {
        keyPath: "id",
      });
      servicesStore.createIndex("updatedAt", "updatedAt");
      servicesStore.createIndex("isDeleted", "isDeleted");
      servicesStore.createIndex("archived", "archived");

      const agendaStore = db.createObjectStore(STORE_AGENDA, { keyPath: "id" });
      agendaStore.createIndex("updatedAt", "updatedAt");
      agendaStore.createIndex("date", "date");
      agendaStore.createIndex("isDeleted", "isDeleted");
    }

    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        const collectionsStore = db.createObjectStore(STORE_COLLECTIONS, {
          keyPath: "id",
        });
        collectionsStore.createIndex("updatedAt", "updatedAt");
        collectionsStore.createIndex("isDeleted", "isDeleted");
      }
    }

    if (oldVersion < 3) {
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    }
  });

  const [rawSongs, rawFolders, rawCollections, rawServices, rawAgenda] = await Promise.all([
    idbGetAll<AsSongDoc>(idb, STORE_SONGS),
    idbGetAll<AsFolderDoc>(idb, STORE_FOLDERS),
    idbGetAll<AsCollectionDoc>(idb, STORE_COLLECTIONS),
    idbGetAll<AsServiceDoc>(idb, STORE_SERVICES),
    idbGetAll<AsAgendaDoc>(idb, STORE_AGENDA),
  ]);

  const initialFolders = recalculateFolderCounts(rawFolders, rawSongs);
  const initialCollections = recalculateCollectionCounts(rawCollections, rawSongs);

  const db: HosanaDatabase = {
    _idb: idb,
    songs: new HosanaCollection<AsSongDoc>(idb, STORE_SONGS, rawSongs, {
      localFields: ["score"],
      computedFields: {
        score: (song) => parseChordPro(song.content).score(),
      },
    }),
    folders: new HosanaCollection<AsFolderDoc>(idb, STORE_FOLDERS, initialFolders, {
      localFields: ["songCount", "folderCount"],
    }),
    collections: new HosanaCollection<AsCollectionDoc>(idb, STORE_COLLECTIONS, initialCollections, {
      localFields: ["songCount"],
    }),
    services: new HosanaCollection<AsServiceDoc>(idb, STORE_SERVICES, rawServices),
    agendaEvents: new HosanaCollection<AsAgendaDoc>(idb, STORE_AGENDA, rawAgenda),
  };

  // Persist derived counts (memory already corrected above; this writes IDB).
  await recalculateAllDerivedCounts(db);

  return db;
}

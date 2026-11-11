/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared org catalog — one interface every Logos host uses for proposals.
 */

export type CatalogSong = {
  id: string;
  title: string;
  artist?: string;
  content: string;
  song_number?: number | null;
  updatedAt?: string;
};

export type CatalogServiceElement = {
  id: string;
  type: string;
  title?: string;
  songId?: string;
  content?: string;
  position?: number;
  notes?: string;
  passage?: string;
  duration?: number;
};

export type CatalogService = {
  id: string;
  name: string;
  date?: string;
  notes?: string | null;
  elements: CatalogServiceElement[];
  updatedAt?: string;
};

export type CatalogResourceMap = {
  song: CatalogSong;
  service: CatalogService;
};

export type CatalogResourceKind = keyof CatalogResourceMap;

export type CatalogSongPatch = Partial<
  Pick<CatalogSong, "title" | "artist" | "content" | "song_number" | "updatedAt">
>;

export type CatalogServicePatch = Partial<
  Pick<CatalogService, "name" | "notes" | "elements" | "updatedAt">
>;

export type CatalogPatchMap = {
  song: CatalogSongPatch;
  service: CatalogServicePatch;
};

/** Pluggable handlers — Studio RxDB, HTTP, mocks, … */
export type CatalogHandlers = {
  song?: {
    get: (id: string) => Promise<CatalogSong | null>;
    update: (id: string, patch: CatalogSongPatch) => Promise<CatalogSong | void>;
  };
  service?: {
    get: (id: string) => Promise<CatalogService | null>;
    update: (id: string, patch: CatalogServicePatch) => Promise<CatalogService | void>;
  };
};

export type LogosCatalog = {
  get<K extends CatalogResourceKind>(
    kind: K,
    id: string,
  ): Promise<CatalogResourceMap[K] | null>;
  update<K extends CatalogResourceKind>(
    kind: K,
    id: string,
    patch: CatalogPatchMap[K],
  ): Promise<void>;
  canUpdate(kind: CatalogResourceKind): boolean;
};

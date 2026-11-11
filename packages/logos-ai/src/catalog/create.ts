/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CatalogHandlers,
  CatalogPatchMap,
  CatalogResourceKind,
  CatalogResourceMap,
  LogosCatalog,
} from "./types";

export type CreateCatalogOptions = {
  handlers: CatalogHandlers;
  canUpdate?: Partial<Record<CatalogResourceKind, boolean>>;
};

/** Build a LogosCatalog from per-resource get/update handlers. */
export function createCatalog(opts: CreateCatalogOptions): LogosCatalog {
  const { handlers, canUpdate = {} } = opts;

  return {
    async get(kind, id) {
      const h = handlers[kind];
      if (!h) return null;
      return (await h.get(id)) as CatalogResourceMap[typeof kind] | null;
    },
    async update(kind, id, patch) {
      const h = handlers[kind];
      if (!h) throw new Error(`Catalog has no handler for ${kind}`);
      let next = patch as CatalogPatchMap[typeof kind];
      if (!("updatedAt" in next && next.updatedAt) && h.get) {
        const current = await h.get(id);
        if (!current?.updatedAt) throw new Error(`${kind} not found or missing updatedAt`);
        next = { ...next, updatedAt: current.updatedAt } as CatalogPatchMap[typeof kind];
      }
      await h.update(id, next);
    },
    canUpdate(kind) {
      return Boolean(canUpdate[kind] && handlers[kind]);
    },
  };
}

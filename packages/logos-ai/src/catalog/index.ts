/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type {
  CatalogHandlers,
  CatalogPatchMap,
  CatalogResourceKind,
  CatalogResourceMap,
  CatalogService,
  CatalogServiceElement,
  CatalogServicePatch,
  CatalogSong,
  CatalogSongPatch,
  LogosCatalog,
} from "./types";
export { createCatalog, type CreateCatalogOptions } from "./create";
export { createHttpCatalog, type CatalogRequest, type CreateHttpCatalogOptions } from "./http";
export { useCatalogResource, useApplyProposal } from "./hooks";

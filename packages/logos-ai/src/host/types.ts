/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Compatibility re-exports — prefer `@hosanna/logos-ai` kernel + catalog types.
 */

export type {
  LogosApi,
  LogosHost,
  LogosSongAdapter,
  LogosTc,
  LogosTranslate,
} from "../kernel/host";
export type { LogosHostProfile } from "../kernel/capabilities";
export type {
  CatalogSong as LogosSong,
  CatalogService as LogosService,
  CatalogServiceElement as LogosServiceElement,
} from "../catalog/types";

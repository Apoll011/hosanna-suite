/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export { LogosHostProvider, useLogosHost, useLogosI18n } from "./context";
export { LogosRouteProvider, useLogosRoute, type LogosRouteState } from "./route";
export {
  LogosSongAdapterProvider,
  useHostSong,
  useHostUpdateSong,
  useLogosSongAdapter,
} from "./songAdapter";
export {
  AUTH_HOST_PROFILE,
  DEFAULT_MUSIC_APP,
  DEFAULT_PLANNING_APP,
  STUDIO_HOST_PROFILE,
  hasCapability,
  musicAppId,
  planningAppId,
  thinHostProfile,
  type LogosAppId,
  type LogosCapability,
  type LogosHostProfile,
} from "./capabilities";
export {
  useCatalogService,
  useCatalogSong,
  useCatalogUpdateService,
  useCatalogUpdateSong,
  type CatalogServiceState,
  type CatalogSongState,
} from "./catalog";
export type {
  LogosApi,
  LogosHost,
  LogosService,
  LogosServiceElement,
  LogosSong,
  LogosSongAdapter,
  LogosTc,
  LogosTranslate,
} from "./types";

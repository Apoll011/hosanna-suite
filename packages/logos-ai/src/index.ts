/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export { AiChatDock } from "./chat/components/Dock";
export { AiChatProvider, useAiChat, useAiChatOptional } from "./chat/provider";
export { AiChatToggle } from "./chat/components/Toggle";
export { LogosMascot } from "./mascot";
export { AiProposalBanner } from "./proposals/components/Banner";
export {
  AUTH_HOST_PROFILE,
  DEFAULT_MUSIC_APP,
  DEFAULT_PLANNING_APP,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  STUDIO_HOST_PROFILE,
  hasCapability,
  musicAppId,
  planningAppId,
  thinHostProfile,
  useCatalogSong,
  useCatalogUpdateSong,
  useHostSong,
  useHostUpdateSong,
  useLogosHost,
  useLogosI18n,
  useLogosRoute,
  type CatalogSongState,
  type LogosApi,
  type LogosAppId,
  type LogosCapability,
  type LogosHost,
  type LogosHostProfile,
  type LogosRouteState,
  type LogosServiceElement,
  type LogosSong,
  type LogosSongAdapter,
  type LogosTc,
  type LogosTranslate,
} from "./host";

export type { AiChatContext, AiConfirmAction, AiSettingsPublic, AiUiMessage } from "./types";
export {
  AI_LIBRARY_CHANGED_EVENT,
  AI_NAVIGATE_EVENT,
  AI_OPEN_APP_EVENT,
  AI_PRINT_EVENT,
  AI_SETTINGS_CHANGED_EVENT,
  aiContextBridge,
  dispatchAiNavigate,
  dispatchAiOpenApp,
  dispatchAiPrint,
  dispatchAiSettingsChanged,
  dispatchLibraryChanged,
  performOpenApp,
  resolveHosannaAppOrigin,
  warmHosannaAppOrigin,
  type AiNavigateDetail,
  type AiOpenAppDetail,
  type AiPrintDetail,
  type OpenAppNavigateContext,
  type PerformOpenAppOptions,
} from "./core/bridge";
export { logosAiMessages, type LogosAiMessages } from "./i18n";
export {
  aiProposals,
  useAiProposals,
  useServiceProposal,
  useSongProposal,
  useSongProposalStatus,
  type ProposalStatus,
  type AiProposal,
  type ServiceProposal,
  type SongProposal,
} from "./proposals/store";
export { DIFF_THEME_STYLE, useDiffLabels } from "./proposals/diff";

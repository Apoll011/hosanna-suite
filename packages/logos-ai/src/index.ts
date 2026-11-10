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
  LogosHostProvider,
  LogosSongAdapterProvider,
  useHostSong,
  useHostUpdateSong,
  useLogosHost,
  useLogosI18n,
  type LogosApi,
  type LogosHost,
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
  AI_PRINT_EVENT,
  AI_SETTINGS_CHANGED_EVENT,
  aiContextBridge,
  dispatchAiNavigate,
  dispatchAiPrint,
  dispatchAiSettingsChanged,
  dispatchLibraryChanged,
  type AiNavigateDetail,
  type AiPrintDetail,
} from "./core/bridge";
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

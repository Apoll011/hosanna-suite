/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export { useProposalActions } from "./actions";
export { DIFF_THEME_STYLE, useDiffLabels } from "./diff";
export {
  extractDestructiveConfirmation,
  extractHostUiOffer,
  extractServiceProposal,
  extractSongProposal,
  type AiDestructiveConfirmation,
  type AiHostUiOffer,
} from "./parse";
export { maybeStageProposal } from "./stage";
export {
  aiProposals,
  useAiProposals,
  useServiceProposal,
  useServiceProposalStatus,
  useSongProposal,
  useSongProposalStatus,
  type AiProposal,
  type ProposalStatus,
  type ServiceProposal,
  type SongProposal,
} from "./store";
export { useOpenEditorKey } from "./hooks/useOpenEditorKey";
export { AiProposalBanner } from "./components/Banner";
export { AiProposalCard } from "./components/Card";
export { AiServiceProposalCard } from "./components/ServiceCard";
export { AiProposalTray } from "./components/Tray";
export { AiProposalReview } from "./components/Review";
export { AiDiffView } from "./components/DiffView";

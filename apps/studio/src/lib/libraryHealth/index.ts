/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export {
  SCORE_CRITERIA,
  computeLibraryHealth,
  type LibraryHealthCategory,
  type LibraryHealthIssueSong,
  type LibraryHealthSummary,
  type ScoreMissingCriterion,
} from "./compute";

export {
  LIBRARY_HEALTH_AUTO_FIXES,
  applyLibraryHealthAutoFixes,
  getAutoFixForCriterion,
  injectChordProDirective,
  listAutoFixes,
  type ApplyAutoFixesOptions,
  type ApplyAutoFixesResult,
  type LibraryHealthAutoFix,
} from "./autoFixes";

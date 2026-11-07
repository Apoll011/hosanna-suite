/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

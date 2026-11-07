/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type { LibraryHealthAutoFix } from "./types";
export { applyLibraryHealthAutoFixes } from "./apply";
export type { ApplyAutoFixesOptions, ApplyAutoFixesResult } from "./apply";
export {
  getAutoFixForCriterion,
  listAutoFixes,
  LIBRARY_HEALTH_AUTO_FIXES,
} from "./registry";
export { injectChordProDirective } from "./chordProMeta";

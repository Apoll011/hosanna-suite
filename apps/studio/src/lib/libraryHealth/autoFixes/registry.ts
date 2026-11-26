/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ScoreMissingCriterion } from "./types";
import { durationAutoFix } from "./duration";
import { keyAutoFix } from "./key";
import type { LibraryHealthAutoFix } from "./types";

/**
 * Registered auto-fixes. Append new fixers here as they are implemented.
 * Order is stable for UI / apply-all iteration.
 */
export const LIBRARY_HEALTH_AUTO_FIXES: readonly LibraryHealthAutoFix[] = [
  keyAutoFix,
  durationAutoFix,
];

export function getAutoFixForCriterion(
  criterion: ScoreMissingCriterion,
): LibraryHealthAutoFix | undefined {
  return LIBRARY_HEALTH_AUTO_FIXES.find((fix) => fix.criterion === criterion);
}

export function listAutoFixes(): readonly LibraryHealthAutoFix[] {
  return LIBRARY_HEALTH_AUTO_FIXES;
}

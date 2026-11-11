/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseToolActions, stageProposalActions } from "../actions";
import type { PageContextSnapshot } from "../types";

/** Stage proposals from tool output (tests + legacy). Runtime uses dispatchLogosActions. */
export function maybeStageProposal(
  toolName: string,
  output: unknown,
  page: PageContextSnapshot,
): void {
  stageProposalActions(
    parseToolActions(toolName, output, {
      songId: page.songId,
      serviceId: page.serviceId,
      title: page.title,
    }),
  );
}

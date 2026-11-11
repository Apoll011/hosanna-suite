/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * @deprecated Prefer `parseToolActions` + `dispatchLogosActions`.
 */

import { dispatchLogosActions, parseToolActions } from "../../actions";
import type { LogosHost } from "../../kernel/host";

export function maybeDispatchHostActions(
  toolName: string,
  output: unknown,
  host?: LogosHost | null,
) {
  if (!host) return;
  const actions = parseToolActions(toolName, output);
  // Only host shell actions — proposals are staged by useChatStream via the same parser.
  dispatchLogosActions(
    actions.filter((a) => a.type !== "propose"),
    host,
  );
}

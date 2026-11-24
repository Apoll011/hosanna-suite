/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { messageText, type AiThread } from "../../types";

export function deriveThreadTitle(thread: AiThread): string {
  const first = thread.messages.find((m) => m.role === "user");
  const text = first ? messageText(first) : "";
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 59)}…` : oneLine;
}

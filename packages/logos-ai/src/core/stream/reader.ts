/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StreamEvent } from "./types";

export async function* readUiMessageStream(response: Response): AsyncGenerator<StreamEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        let payload = line;
        if (line.startsWith("data:")) {
          payload = line.slice(5).trim();
        }
        if (!payload || payload === "[DONE]") continue;
        try {
          yield JSON.parse(payload) as StreamEvent;
        } catch {
          /* ignore malformed chunk */
        }
      }
    }

    const tail = buffer.trim();
    if (tail && tail !== "[DONE]") {
      const payload = tail.startsWith("data:") ? tail.slice(5).trim() : tail;
      if (payload) {
        try {
          yield JSON.parse(payload) as StreamEvent;
        } catch {
          /* ignore */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

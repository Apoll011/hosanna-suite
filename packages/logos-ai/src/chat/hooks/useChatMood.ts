/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import type { AiChatMessage, LogosMood } from "../../types";

export function useChatMood(streaming: boolean, messages: AiChatMessage[]) {
  const [mood, setMood] = useState<LogosMood>("idle");
  const hadStreamRef = useRef(false);

  useEffect(() => {
    if (streaming) {
      hadStreamRef.current = true;
      const last = messages[messages.length - 1];
      const working = last?.parts.some((p) => p.type === "tool" && p.tool.status === "running");
      const singing = last?.parts.some((p) => p.type === "text" && p.text.trim().length > 0);
      // Tools running → headphones-on busy; words arriving → singing;
      // otherwise pondering.
      setMood(working ? "working" : singing ? "singing" : "thinking");
      return;
    }
    if (!hadStreamRef.current) return;
    hadStreamRef.current = false;
    const last = messages[messages.length - 1];
    const failed = Boolean(last?.error);
    const stopped = Boolean(last?.aborted);
    if (stopped) {
      setMood("idle");
      return;
    }
    const usedTools = last?.parts.some((p) => p.type === "tool" && p.tool.status === "done");
    setMood(failed ? "oops" : usedTools ? "celebrating" : "happy");
    const timer = window.setTimeout(() => setMood("idle"), failed ? 4000 : 2800);
    return () => window.clearTimeout(timer);
  }, [streaming, messages]);

  return { mood, setMood };
}

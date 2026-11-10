/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from "react";
import type {
  AiChatMessage,
  AiSettingsPublic,
  AiThreadSummary,
  LogosMood,
  PageContextSnapshot,
  QuickChip,
} from "../types";

export type AiChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  messages: AiChatMessage[];
  streaming: boolean;
  error: string | null;
  settings: AiSettingsPublic | null;
  canUse: boolean;
  visible: boolean;
  chips: QuickChip[];
  pageContext: PageContextSnapshot;
  mood: LogosMood;
  includeContext: boolean;
  setIncludeContext: (v: boolean) => void;
  threads: AiThreadSummary[];
  threadId: string;
  send: (text: string) => Promise<void>;
  stop: () => void;
  /** Delete the current conversation and start fresh. */
  clear: () => void;
  newChat: () => void;
  openThread: (id: string) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  /** Re-run the last assistant reply. */
  regenerate: () => Promise<void>;
  /** Replace a user message with new text and re-run from there. */
  editAndResend: (messageId: string, text: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

export const AiChatCtx = createContext<AiChatContextValue | null>(null);

export function useAiChat(): AiChatContextValue {
  const ctx = useContext(AiChatCtx);
  if (!ctx) {
    throw new Error("useAiChat must be used within AiChatProvider");
  }
  return ctx;
}

/** Safe when provider may be absent (e.g. address bar outside mount). */
export function useAiChatOptional(): AiChatContextValue | null {
  return useContext(AiChatCtx);
}

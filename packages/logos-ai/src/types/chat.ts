/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LucideIcon } from "lucide-react";
import type { AiChatContext } from "./api";

export type AiToolCallState = {
  toolCallId: string;
  toolName: string;
  status: "running" | "done" | "error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
  startedAt?: number;
  endedAt?: number;
};

export type AiMessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool"; tool: AiToolCallState }
  /** Model step boundary (kept so history round-trips faithfully). */
  | { type: "step" };

export type AiMessageMeta = {
  durationMs?: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  steps?: number;
  finishReason?: string;
  /** Tool calls used for this reply and the org limit. */
  toolCalls?: number;
  toolLimit?: number;
  /** Tools were switched off so the model had to write a final answer. */
  limitReached?: boolean;
};

export type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: AiMessagePart[];
  createdAt: number;
  error?: string;
  /** User pressed Stop while this reply was streaming. */
  aborted?: boolean;
  /** Reply ended because the server hit its step budget. */
  truncated?: boolean;
  meta?: AiMessageMeta;
  /** Suggested follow-up prompts (from `suggest_followups`). */
  followups?: string[];
};

export type AiThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AiChatMessage[];
};

export type AiThreadSummary = Pick<AiThread, "id" | "title" | "createdAt" | "updatedAt"> & {
  messageCount: number;
};

export type QuickChip = {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  /** Localized prompt sent as the user message. */
  promptKey: string;
};

export type PageContextSnapshot = AiChatContext;

/** Tools whose cards are noise for the user (hidden from the tool list). */
export const SILENT_TOOLS = new Set(["studio_sync", "suggest_followups"]);

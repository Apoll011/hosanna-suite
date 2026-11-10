/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Minimal UI-message stream event types from AI SDK `toUIMessageStreamResponse`. */
export type StreamEvent =
  | { type: "start"; messageId?: string; messageMetadata?: unknown }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | {
      type: "tool-input-start";
      toolCallId: string;
      toolName: string;
    }
  | {
      type: "tool-input-available";
      toolCallId: string;
      toolName: string;
      input: unknown;
    }
  | {
      type: "tool-output-available";
      toolCallId: string;
      output: unknown;
    }
  | { type: "error"; errorText?: string }
  | { type: "finish"; finishReason?: string; messageMetadata?: unknown }
  | { type: "message-metadata"; messageMetadata?: unknown }
  | { type: string; [key: string]: unknown };

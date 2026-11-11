/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { buildPageContext, maybeDispatchHostActions, maybeSyncLibrary } from "../../core/bridge";
import {
  applyStreamEvent,
  readUiMessageStream,
  settleRunningTools,
  type StreamEvent,
} from "../../core/stream";
import { useLogosHost } from "../../host";
import { maybeStageProposal } from "../../proposals/stage";
import { newId, toUiMessages, type AiChatMessage } from "../../types";

export function useChatStream(opts: {
  routeRef: MutableRefObject<{
    pathname: string;
    slugPrefix: string;
    params: { id?: string };
  }>;
  deriveViewRef: MutableRefObject<(pathname: string, slugPrefix: string) => string>;
  includeContext: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const host = useLogosHost();
  const { api, language, profile } = host;
  const { routeRef, deriveViewRef, includeContext, setOpen } = opts;

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<AiChatMessage[]>([]);
  const streamingRef = useRef(false);
  const localeRef = useRef(language);
  localeRef.current = language;
  const includeContextRef = useRef(includeContext);
  includeContextRef.current = includeContext;
  const apiRef = useRef(api);
  apiRef.current = api;
  const hostRef = useRef(host);
  hostRef.current = host;
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Core: stream an assistant reply for `history` (ends with a user turn). */
  const run = useCallback(
    async (history: AiChatMessage[]) => {
      if (streamingRef.current) return;
      streamingRef.current = true;

      const assistantId = newId();
      const startedAt = Date.now();
      const assistantMsg: AiChatMessage = {
        id: assistantId,
        role: "assistant",
        parts: [],
        createdAt: startedAt,
      };
      setError(null);
      setOpen(true);
      setMessages([...history, assistantMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const toolNames = new Map<string, string>();

      const patch = (fn: (m: AiChatMessage) => AiChatMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));
      };

      // Batch text/reasoning deltas to one render per frame.
      type PendingDelta = { type: "text-delta" | "reasoning-delta"; delta: string };
      let pending: PendingDelta | null = null;
      let scheduled = 0;
      const flush = () => {
        if (scheduled) {
          if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(scheduled);
          window.clearTimeout(scheduled);
          scheduled = 0;
        }
        const current: PendingDelta | null = pending;
        if (!current) return;
        pending = null;
        patch((m) => applyStreamEvent(m, current as StreamEvent));
      };
      const schedule = () => {
        if (scheduled) return;
        if (document.visibilityState === "hidden") {
          scheduled = window.setTimeout(flush, 50);
        } else {
          scheduled = requestAnimationFrame(flush);
        }
      };

      try {
        const r = routeRef.current;
        const page = includeContextRef.current
          ? buildPageContext(r.pathname, r.slugPrefix, r.params, deriveViewRef.current)
          : { kind: "general" as const, route: r.pathname };
        const hostMeta = {
          hostApp: profileRef.current.appId,
          hostCapabilities: [...profileRef.current.capabilities],
        };
        const response = await apiRef.current.streamChat({
          messages: toUiMessages(history),
          context: { ...page, ...hostMeta },
          locale: localeRef.current,
          signal: controller.signal,
        });

        for await (const event of readUiMessageStream(response)) {
          if (controller.signal.aborted) break;

          if (
            (event.type === "text-delta" || event.type === "reasoning-delta") &&
            typeof event.delta === "string"
          ) {
            const kind = event.type as PendingDelta["type"];
            const deltaText = String(event.delta ?? "");
            if (pending && pending.type !== kind) flush();
            const priorDelta: string = pending ? pending.delta : "";
            pending = { type: kind, delta: priorDelta + deltaText };
            schedule();
            continue;
          }

          flush();
          patch((m) => applyStreamEvent(m, event));

          if (event.type === "tool-input-start" || event.type === "tool-input-available") {
            if (typeof event.toolName === "string") {
              toolNames.set(String(event.toolCallId), event.toolName);
            }
          } else if (event.type === "tool-output-available") {
            const name = toolNames.get(String(event.toolCallId)) ?? "tool";
            const rr = routeRef.current;
            maybeStageProposal(
              name,
              event.output,
              buildPageContext(rr.pathname, rr.slugPrefix, rr.params, deriveViewRef.current),
            );
            maybeSyncLibrary(name, event.output);
            maybeDispatchHostActions(name, event.output, hostRef.current);
          } else if (event.type === "error") {
            setError(typeof event.errorText === "string" ? event.errorText : "AI stream error");
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : "Failed to reach AI chat";
          setError(message);
          patch((m) => ({ ...m, error: message }));
        }
      } finally {
        flush();
        const aborted = controller.signal.aborted;
        patch((m) => {
          const settled = settleRunningTools(m, aborted ? "stopped" : "interrupted");
          return {
            ...settled,
            aborted: settled.aborted || aborted || undefined,
            meta: {
              ...settled.meta,
              durationMs: settled.meta?.durationMs ?? Date.now() - startedAt,
            },
          };
        });
        if (abortRef.current === controller) abortRef.current = null;
        streamingRef.current = false;
        setStreaming(false);
      }
    },
    [routeRef, deriveViewRef, setOpen],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;
      const userMsg: AiChatMessage = {
        id: newId(),
        role: "user",
        parts: [{ type: "text", text: trimmed }],
        createdAt: Date.now(),
      };
      await run([...messagesRef.current, userMsg]);
    },
    [run],
  );

  const regenerate = useCallback(async () => {
    if (streamingRef.current) return;
    const current = messagesRef.current;
    let end = current.length;
    while (end > 0 && current[end - 1].role === "assistant") end--;
    if (end === 0) return;
    await run(current.slice(0, end));
  }, [run]);

  const editAndResend = useCallback(
    async (messageId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;
      const current = messagesRef.current;
      const idx = current.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const edited: AiChatMessage = {
        ...current[idx],
        parts: [{ type: "text", text: trimmed }],
      };
      await run([...current.slice(0, idx), edited]);
    },
    [run],
  );

  return {
    messages,
    setMessages,
    streaming,
    setStreaming,
    error,
    setError,
    abortRef,
    messagesRef,
    streamingRef,
    stop,
    send,
    regenerate,
    editAndResend,
  };
}

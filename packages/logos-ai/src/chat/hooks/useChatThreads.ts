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
import { deriveThreadTitle, threadStore } from "../../core/threads";
import { useLogosHost } from "../../host";
import { newId, type AiChatMessage, type AiThread, type AiThreadSummary, type LogosMood } from "../../types";

type MoodSetter = Dispatch<SetStateAction<LogosMood>>;

export function useChatThreads(opts: {
  messages: AiChatMessage[];
  streaming: boolean;
  messagesRef: MutableRefObject<AiChatMessage[]>;
  streamingRef: MutableRefObject<boolean>;
  abortRef: MutableRefObject<AbortController | null>;
  setMessages: Dispatch<SetStateAction<AiChatMessage[]>>;
  setStreaming: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMood: MoodSetter;
  open: boolean;
}) {
  const { scope } = useLogosHost();
  const {
    messages,
    streaming,
    messagesRef,
    streamingRef,
    abortRef,
    setMessages,
    setStreaming,
    setError,
    setMood,
    open,
  } = opts;

  const [threads, setThreads] = useState<AiThreadSummary[]>([]);
  const [threadId, setThreadId] = useState<string>(() => newId());
  const [threadCreatedAt, setThreadCreatedAt] = useState(() => Date.now());
  const restoredScopeRef = useRef<string | null>(null);

  const refreshThreads = useCallback(async () => {
    if (!scope) {
      setThreads([]);
      return;
    }
    setThreads(await threadStore.list(scope));
  }, [scope]);

  useEffect(() => {
    if (!scope || restoredScopeRef.current === scope) return;
    restoredScopeRef.current = scope;
    let cancelled = false;
    void threadStore.list(scope).then((list) => {
      if (!cancelled) setThreads(list);
    });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  // Persist after each completed turn (never mid-stream).
  useEffect(() => {
    if (!scope || streaming || messages.length === 0) return;
    const handle = window.setTimeout(() => {
      const thread: AiThread = {
        id: threadId,
        title: "",
        createdAt: threadCreatedAt,
        updatedAt: Date.now(),
        messages,
      };
      thread.title = deriveThreadTitle(thread);
      void threadStore.save(scope, thread).then(refreshThreads);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [messages, streaming, scope, threadId, threadCreatedAt, refreshThreads]);

  const resetConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    setStreaming(false);
    setMessages([]);
    messagesRef.current = [];
    setError(null);
    setThreadId(newId());
    setThreadCreatedAt(Date.now());
    setMood("idle");
  }, [abortRef, streamingRef, messagesRef, setStreaming, setMessages, setError, setMood]);

  const newChat = useCallback(() => resetConversation(), [resetConversation]);

  // Opening the chat starts a new conversation. The previous one is saved
  // first and stays available in History. A reply that is still streaming is
  // never discarded.
  const wasOpenRef = useRef(false);
  const threadRef = useRef({ scope, threadId, threadCreatedAt });
  threadRef.current = { scope, threadId, threadCreatedAt };
  useEffect(() => {
    const opened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!opened || streamingRef.current) return;
    const current = messagesRef.current;
    if (current.length === 0) return;
    const { scope: sc, threadId: id, threadCreatedAt: created } = threadRef.current;
    if (sc) {
      const thread: AiThread = {
        id,
        title: "",
        createdAt: created,
        updatedAt: Date.now(),
        messages: current,
      };
      thread.title = deriveThreadTitle(thread);
      void threadStore.save(sc, thread).then(refreshThreads);
    }
    resetConversation();
  }, [open, resetConversation, refreshThreads, streamingRef, messagesRef]);

  const deleteThread = useCallback(
    async (id: string) => {
      if (!scope) return;
      await threadStore.remove(scope, id);
      if (id === threadId) resetConversation();
      await refreshThreads();
    },
    [scope, threadId, resetConversation, refreshThreads],
  );

  const clear = useCallback(() => {
    const id = threadId;
    resetConversation();
    if (scope) void threadStore.remove(scope, id).then(refreshThreads);
  }, [threadId, scope, resetConversation, refreshThreads]);

  const openThread = useCallback(
    async (id: string) => {
      if (!scope) return;
      const thread = await threadStore.load(scope, id);
      if (!thread) return;
      abortRef.current?.abort();
      setThreadId(thread.id);
      setThreadCreatedAt(thread.createdAt);
      setMessages(thread.messages);
      setError(null);
      setMood("idle");
    },
    [scope, abortRef, setMessages, setError, setMood],
  );

  return {
    threads,
    threadId,
    threadCreatedAt,
    refreshThreads,
    resetConversation,
    newChat,
    deleteThread,
    clear,
    openThread,
  };
}

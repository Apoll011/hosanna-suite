/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../mascot/styles.css";
import { AiChatCtx, type AiChatContextValue } from "./context";
import { useChatMood } from "./hooks/useChatMood";
import { useChatSettings } from "./hooks/useChatSettings";
import { useChatStream } from "./hooks/useChatStream";
import { useChatThreads } from "./hooks/useChatThreads";
import { usePageContextState } from "./hooks/usePageContextState";

export { useAiChat, useAiChatOptional } from "./context";

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);

  const { settings, refreshSettings, canUse, visible } = useChatSettings();
  const { pageContext, chips, routeRef, deriveViewRef } = usePageContextState(open);

  const {
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
  } = useChatStream({ routeRef, deriveViewRef, includeContext, setOpen });

  const { mood, setMood } = useChatMood(streaming, messages);

  const { threads, threadId, newChat, deleteThread, clear, openThread } = useChatThreads({
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
  });

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Ctrl/Cmd + Shift + L toggles the chat.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const value = useMemo<AiChatContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      messages,
      streaming,
      error,
      settings,
      canUse,
      visible,
      chips,
      pageContext,
      mood,
      includeContext,
      setIncludeContext,
      threads,
      threadId,
      send,
      stop,
      clear,
      newChat,
      openThread,
      deleteThread,
      regenerate,
      editAndResend,
      refreshSettings,
    }),
    [
      open,
      toggle,
      messages,
      streaming,
      error,
      settings,
      canUse,
      visible,
      chips,
      pageContext,
      mood,
      includeContext,
      threads,
      threadId,
      send,
      stop,
      clear,
      newChat,
      openThread,
      deleteThread,
      regenerate,
      editAndResend,
      refreshSettings,
    ],
  );

  return <AiChatCtx.Provider value={value}>{children}</AiChatCtx.Provider>;
};

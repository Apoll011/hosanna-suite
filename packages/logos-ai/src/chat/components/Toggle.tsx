/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useLogosI18n } from "../../host";
import React from "react";
import { useAiChatOptional } from "../context";
import { useAiProposals } from "../../proposals/store";
import { prefetchAiChatPanel } from "./panelChunk";
import { LogosMascot } from "../../mascot";

/** Address-bar entry point for Logos. */
export const AiChatToggle: React.FC = () => {
  const { t, tc } = useLogosI18n();
  const chat = useAiChatOptional();
  const pending = useAiProposals().length;
  if (!chat?.visible) return null;

  const busy = chat.streaming;
  const label = chat.open ? t("ai.chat.close") : t("ai.chat.open");

  return (
    <button
      type="button"
      onClick={chat.toggle}
      onPointerEnter={prefetchAiChatPanel}
      onFocus={prefetchAiChatPanel}
      title={`${label} (Ctrl+Shift+L)`}
      aria-label={label}
      aria-pressed={chat.open}
      data-busy={busy}
      className={`logos-chat-toggle group relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-m3-secondary transition-[background,color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-m3-card ${
        chat.open
          ? "bg-m3-primary/10 text-m3-primary"
          : "border-0 bg-transparent hover:bg-m3-hover hover:text-m3-text"
      }`}
    >
      <LogosMascot size={25} mood={busy ? "thinking" : "idle"} />

      {pending > 0 ? (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-m3-primary text-center text-[10px] font-bold leading-4 text-white ring-2 ring-m3-card"
          aria-label={tc("ai.chat.proposals.pending", pending)}
        >
          {pending}
        </span>
      ) : null}
    </button>
  );
};

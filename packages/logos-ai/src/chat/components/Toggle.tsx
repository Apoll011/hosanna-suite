/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLogosI18n } from "../../host";
import React, { useId } from "react";
import { useAiChatOptional } from "../context";
import { useAiProposals } from "../../proposals/store";

/**
 * A four-point sparkle cluster. The two small stars twinkle on their own
 * (faster while Logos is working).
 */
const SparkIcon: React.FC<{ busy: boolean; gradient: boolean }> = ({ busy, gradient }) => {
  const gid = useId().replace(/:/g, "");
  const star = "origin-center transform-fill";
  const fill = gradient ? `url(#${gid})` : "currentColor";
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      {gradient ? (
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="40%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        className={`${star} ${busy ? "animate-pulse" : ""}`}
        fill={fill}
        d="M10.5 3.2c.4-1 1.6-1 2 0l1.5 4.3a5 5 0 0 0 3 3l4.3 1.5c1 .4 1 1.6 0 2l-4.3 1.5a5 5 0 0 0-3 3l-1.5 4.3c-.4 1-1.6 1-2 0l-1.5-4.3a5 5 0 0 0-3-3l-4.3-1.5c-1-.4-1-1.6 0-2l4.3-1.5a5 5 0 0 0 3-3z"
      />
      <path
        className={`${star} ${busy ? "animate-pulse [animation-delay:250ms]" : ""}`}
        fill={fill}
        d="M19.5 1.2l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z"
        opacity="0.9"
      />
      <path
        className={`${star} ${busy ? "animate-pulse [animation-delay:500ms]" : ""}`}
        fill={fill}
        d="M4.5 16.5l.75 1.95 1.95.75-1.95.75-.75 1.95-.75-1.95-1.95-.75 1.95-.75z"
        opacity="0.75"
      />
    </svg>
  );
};

/**
 * Address-bar entry point for Logos: icon-only when closed (Gemini-style
 * gradient sparkle); fully round filled pill when the chat is open.
 */
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
      title={`${label} (Ctrl+Shift+L)`}
      aria-label={label}
      aria-pressed={chat.open}
      className={`group relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-m3-card ${
        chat.open
          ? "rounded-full text-white bg-linear-to-br from-amber-300 via-rose-500 to-indigo-600 shadow-[0_2px_12px_rgb(99_102_241_/0.45)]"
          : "rounded-full border-0 bg-transparent text-m3-secondary hover:bg-m3-hover/80"
      }`}
    >
      <SparkIcon busy={busy} gradient={!chat.open} />
      {busy && !chat.open ? (
        <span
          className="pointer-events-none absolute -inset-0.5 animate-pulse rounded-full ring-2 ring-m3-primary/35"
          aria-hidden
        />
      ) : null}

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

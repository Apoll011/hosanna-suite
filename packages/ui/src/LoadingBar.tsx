/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useState } from "react";
import { cn } from "./cn";

export interface LoadingBarProps {
  /** When true, the bar animates across the top of the viewport. */
  active?: boolean;
  className?: string;
}

/**
 * Thin indeterminate progress strip for route / data transitions.
 * Fixed to the top edge; does not reserve layout space.
 */
export const LoadingBar: React.FC<LoadingBarProps> = React.memo(({ active = false, className }) => {
  const [visible, setVisible] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (active) {
      setEnding(false);
      setVisible(true);
      return;
    }
    if (!visible) return;
    setEnding(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      setEnding(false);
    }, 280);
    return () => window.clearTimeout(t);
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden",
        className,
      )}
      role="progressbar"
      aria-hidden={!active}
      aria-valuetext={active ? "Loading" : undefined}
    >
      <div
        className={cn(
          "h-full origin-left bg-m3-primary shadow-[0_0_8px_color-mix(in_oklab,var(--m3-primary)_55%,transparent)]",
          ending
            ? "w-full transition-[width,opacity] duration-280 ease-out opacity-0"
            : "w-1/3 animate-[hosanna-loading-bar_1.1s_ease-in-out_infinite]",
        )}
      />
      <style>{`
        @keyframes hosanna-loading-bar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
});
LoadingBar.displayName = "LoadingBar";

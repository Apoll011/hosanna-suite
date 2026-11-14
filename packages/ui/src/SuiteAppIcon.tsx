/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from "react";

import { cn } from "./cn";

export type SuiteAppIconProps = {
  logoUrl: string;
  accent?: string;
  /** Outer tile size classes (default h-12 w-12). */
  className?: string;
  /** Extra classes on the img. */
  imgClassName?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "h-10 w-10 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-2xl",
} as const;

export const SuiteAppIcon: React.FC<SuiteAppIconProps> = ({
  logoUrl,
  accent,
  className,
  imgClassName,
  size = "md",
}) => {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        SIZE[size],
        className,
      )}
      style={
        accent
          ? {
              backgroundColor: `${accent}22`,
              boxShadow: `inset 0 0 0 1px ${accent}33, 0 1px 2px rgb(0 0 0 / 0.04)`,
            }
          : { backgroundColor: "color-mix(in srgb, var(--color-m3-sidebar) 90%, transparent)" }
      }
    >
      <img
        src={logoUrl}
        alt=""
        draggable={false}
        className={cn(
          // Square edge-to-edge marks: fill the well 1:1. Parent overflow +
          // radius softens corners without zooming into the artwork.
          "h-full w-full object-cover object-center",
          imgClassName,
        )}
      />
    </span>
  );
};

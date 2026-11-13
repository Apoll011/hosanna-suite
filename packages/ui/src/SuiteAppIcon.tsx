/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App logo tile — soft rounded well + full-bleed contain so brand marks
 * are not a tiny square floating inside a clipped circle.
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
  sm: { tile: "h-10 w-10 rounded-xl", pad: "p-1.5" },
  md: { tile: "h-12 w-12 rounded-2xl", pad: "p-2" },
  lg: { tile: "h-14 w-14 rounded-2xl", pad: "p-2.5" },
} as const;

export const SuiteAppIcon: React.FC<SuiteAppIconProps> = ({
  logoUrl,
  accent,
  className,
  imgClassName,
  size = "md",
}) => {
  const s = SIZE[size];
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        s.tile,
        s.pad,
        className,
      )}
      style={
        accent
          ? {
              backgroundColor: `${accent}18`,
              boxShadow: `inset 0 0 0 1px ${accent}33, 0 1px 2px rgb(0 0 0 / 0.04)`,
            }
          : { backgroundColor: "color-mix(in srgb, var(--color-m3-sidebar) 90%, transparent)" }
      }
    >
      <img
        src={logoUrl}
        alt=""
        draggable={false}
        className={cn("h-full w-full object-contain", imgClassName)}
      />
    </span>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

type BadgeVariant =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  /** @deprecated Use accent */
  | "sky"
  /** @deprecated Use success */
  | "emerald"
  /** @deprecated Use warning */
  | "amber"
  /** @deprecated Use danger */
  | "rose"
  /** @deprecated Use neutral */
  | "slate";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_MAP: Record<string, string> = {
  accent: "bg-m3-primary/10 text-m3-primary border-m3-primary/20",
  sky: "bg-m3-primary/10 text-m3-primary border-m3-primary/20",
  success: "bg-m3-success/10 text-m3-success border-m3-success/20",
  emerald: "bg-m3-success/10 text-m3-success border-m3-success/20",
  warning: "bg-m3-warning/10 text-m3-warning border-m3-warning/20",
  amber: "bg-m3-warning/10 text-m3-warning border-m3-warning/20",
  danger: "bg-m3-danger/10 text-m3-danger border-m3-danger/20",
  rose: "bg-m3-danger/10 text-m3-danger border-m3-danger/20",
  neutral: "bg-m3-hover text-m3-secondary border-m3-border",
  slate: "bg-m3-hover text-m3-secondary border-m3-border",
};

export const Badge: React.FC<BadgeProps> = React.memo(
  ({ children, variant = "accent", size = "sm", className = "" }) => {
    const sizeMap = {
      sm: "px-2 py-0.5 text-[11px] font-semibold",
      md: "px-2.5 py-1 text-xs font-semibold",
    };

    return (
      <span
        className={`inline-flex items-center rounded-[var(--radius-sm)] border ${VARIANT_MAP[variant]} ${sizeMap[size]} ${className}`}
      >
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";

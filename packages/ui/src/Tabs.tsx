/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "underline" | "pill";
  "aria-label"?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onChange,
  className = "",
  variant = "underline",
  "aria-label": ariaLabel = "Tabs",
}) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        variant === "underline"
          ? "h-10 border-b border-m3-border"
          : "rounded-md bg-m3-sidebar/80 p-1"
      } ${className}`}
    >
      {items.map((item) => {
        const selected = item.id === value;
        const base =
          "inline-flex items-center gap-2 shrink-0 box-border px-3.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed " +
          (variant === "underline" ? "h-10" : "h-8");

        const styles =
          variant === "underline"
            ? // -mb-px overlaps the tablist border; overflow-y-hidden on the list
              // prevents that 1px from spawning a tiny vertical scrollbar.
              selected
              ? "text-m3-primary border-b-2 border-m3-primary -mb-px"
              : "text-m3-secondary hover:text-m3-text border-b-2 border-transparent -mb-px"
            : selected
              ? "bg-m3-card text-m3-text shadow-[var(--shadow-sm)] rounded-[var(--radius-sm)]"
              : "text-m3-secondary hover:text-m3-text rounded-[var(--radius-sm)]";

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`tab-${item.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={`${base} ${styles}`}
          >
            {item.icon && (
              <span className="shrink-0" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

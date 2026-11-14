/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Monitor, MoonStar, Sun } from "lucide-react";
import React from "react";

import { cn } from "./cn";

export type MenuThemeValue = "system" | "light" | "dark";

export type MenuThemeToggleProps = {
  value: MenuThemeValue;
  onChange: (theme: MenuThemeValue) => void;
  className?: string;
  labels?: {
    system?: string;
    light?: string;
    dark?: string;
  };
};

const OPTIONS: {
  id: MenuThemeValue;
  Icon: typeof Monitor;
  defaultLabel: string;
}[] = [
  { id: "system", Icon: Monitor, defaultLabel: "Switch to system theme" },
  { id: "light", Icon: Sun, defaultLabel: "Switch to light theme" },
  { id: "dark", Icon: MoonStar, defaultLabel: "Switch to dark theme" },
];

export const MenuThemeToggle: React.FC<MenuThemeToggleProps> = ({
  value,
  onChange,
  className = "",
  labels,
}) => (
  <div
    role="radiogroup"
    aria-label="Theme"
    className={cn(
      "inline-flex items-center overflow-hidden rounded-full bg-m3-card ring-1 ring-inset ring-m3-border",
      className,
    )}
  >
    {OPTIONS.map(({ id, Icon, defaultLabel }) => {
      const selected = value === id;
      const label =
        id === "system"
          ? (labels?.system ?? defaultLabel)
          : id === "light"
            ? (labels?.light ?? defaultLabel)
            : (labels?.dark ?? defaultLabel);
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            "relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors [&_svg]:size-4",
            selected
              ? "text-m3-text"
              : "text-m3-secondary hover:text-m3-text",
          )}
        >
          <Icon aria-hidden />
          {selected ? (
            <span
              className="pointer-events-none absolute inset-0 rounded-full border border-m3-border"
              aria-hidden
            />
          ) : null}
        </button>
      );
    })}
  </div>
);

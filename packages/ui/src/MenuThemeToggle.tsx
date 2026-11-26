/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Language } from "@hosanna/i18n";
import { Monitor, MoonStar, Sun } from "lucide-react";
import React, { useMemo, useRef } from "react";

import { cn } from "./cn";
import { sharedUiT } from "./sharedT";

export type MenuThemeValue = "system" | "light" | "dark";

export type MenuThemeToggleProps = {
  value: MenuThemeValue;
  onChange: (theme: MenuThemeValue) => void;
  className?: string;
  language?: Language;
  labels?: {
    system?: string;
    light?: string;
    dark?: string;
  };
};

const OPTIONS = [
  { id: "system", Icon: Monitor, key: "suite.accountMenu.themeSystem" },
  { id: "light", Icon: Sun, key: "suite.accountMenu.themeLight" },
  { id: "dark", Icon: MoonStar, key: "suite.accountMenu.themeDark" },
] as const;

export const MenuThemeToggle: React.FC<MenuThemeToggleProps> = ({
  value,
  onChange,
  className = "",
  language,
  labels,
}) => {
  const t = useMemo(() => sharedUiT(language), [language]);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = Math.max(
    0,
    OPTIONS.findIndex((option) => option.id === value),
  );

  const getLabel = (id: (typeof OPTIONS)[number]["id"], key: string) => {
    return labels?.[id] ?? t(key);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % OPTIONS.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = OPTIONS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    buttonsRef.current[nextIndex]?.focus();
    onChange(OPTIONS[nextIndex].id);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("suite.accountMenu.theme")}
      className={cn(
        "relative isolate inline-flex items-center rounded-full",
        "bg-m3-secondary/10 p-0.5",
        "ring-1 ring-inset ring-m3-border",
        className,
      )}
    >
      {/* Sliding selection indicator */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 z-0 size-8",
          "rounded-full bg-m3-card",
          "shadow-sm ring-1 ring-inset ring-m3-border",
          "transition-transform duration-300",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          "motion-reduce:transition-none",
        )}
        style={{
          transform: `translateX(${selectedIndex * 100}%)`,
        }}
      />

      {OPTIONS.map(({ id, Icon, key }, index) => {
        const selected = value === id;
        const label = getLabel(id, key);

        return (
          <button
            key={id}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative z-10 flex size-8 items-center justify-center",
              "rounded-full outline-none",
              "focus-visible:ring-2 focus-visible:ring-m3-primary",
              "transition-colors duration-200",
              "motion-reduce:transition-none",
              selected ? "text-m3-text" : "text-m3-secondary hover:text-m3-text",
            )}
          >
            <Icon
              key={`${id}-${selected}`}
              aria-hidden="true"
              strokeWidth={selected ? 2.2 : 1.8}
              className={cn("size-4", selected && `theme-icon-${id}`)}
            />
          </button>
        );
      })}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Language } from "@hosanna/i18n";
import { Monitor, MoonStar, Sun } from "lucide-react";
import React, { useMemo } from "react";

import { cn } from "./cn";
import { sharedUiT } from "./sharedT";

export type MenuThemeValue = "system" | "light" | "dark";

export type MenuThemeToggleProps = {
  value: MenuThemeValue;
  onChange: (theme: MenuThemeValue) => void;
  className?: string;
  /** Active UI language; defaults to `document.documentElement.lang`. */
  language?: Language;
  /** Rare overrides — prefer shared `suite.accountMenu.theme*` keys. */
  labels?: {
    system?: string;
    light?: string;
    dark?: string;
  };
};

const OPTIONS: { id: MenuThemeValue; Icon: typeof Monitor; key: string }[] = [
  { id: "system", Icon: Monitor, key: "suite.accountMenu.themeSystem" },
  { id: "light", Icon: Sun, key: "suite.accountMenu.themeLight" },
  { id: "dark", Icon: MoonStar, key: "suite.accountMenu.themeDark" },
];

export const MenuThemeToggle: React.FC<MenuThemeToggleProps> = ({
  value,
  onChange,
  className = "",
  language,
  labels,
}) => {
  const t = useMemo(() => sharedUiT(language), [language]);

  return (
    <div
      role="radiogroup"
      aria-label={t("suite.accountMenu.theme")}
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full bg-m3-card ring-1 ring-inset ring-m3-border",
        className,
      )}
    >
      {OPTIONS.map(({ id, Icon, key }) => {
        const selected = value === id;
        const label =
          id === "system"
            ? (labels?.system ?? t(key))
            : id === "light"
              ? (labels?.light ?? t(key))
              : (labels?.dark ?? t(key));
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
              selected ? "text-m3-text" : "text-m3-secondary hover:text-m3-text",
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
};

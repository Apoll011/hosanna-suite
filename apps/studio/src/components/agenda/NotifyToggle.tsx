/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, BellOff } from "lucide-react";
import React from "react";

interface NotifyToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}

/**
 * Optional notification switch used in agenda delete/removal confirmations.
 * Knob position matches the shared switch pattern (left = off, right = on).
 */
export const NotifyToggle: React.FC<NotifyToggleProps> = ({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}) => {
  const Icon = checked ? Bell : BellOff;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
    >
      <span className="flex items-start gap-2 min-w-0">
        <Icon
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            checked ? "text-sky-500" : "text-slate-400"
          }`}
        />
        <span className="min-w-0">
          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </span>
          <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {hint}
          </span>
        </span>
      </span>
      <span
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
};

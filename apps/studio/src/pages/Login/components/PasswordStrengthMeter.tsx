/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface Requirement {
  label: string;
  test: (p: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "Mínimo 6 caracteres", test: (p) => p.length >= 6 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /\d/.test(p) },
  { label: "Carácter especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string): number {
  return REQUIREMENTS.filter((r) => r.test(password)).length;
}

const STRENGTH_LABELS = [
  "",
  "Muito fraca",
  "Fraca",
  "Razoável",
  "Forte",
  "Muito forte",
];
const STRENGTH_COLORS = [
  "",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-emerald-500",
];
const STRENGTH_TEXT_COLORS = [
  "",
  "text-rose-500 dark:text-rose-400",
  "text-orange-500 dark:text-orange-400",
  "text-amber-500 dark:text-amber-400",
  "text-emerald-500 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getStrength(password);

  return (
    <div className="space-y-2 px-1 animate-in fade-in duration-200">
      {/* Strength bar */}
      <div className="flex gap-1 h-1">
        {REQUIREMENTS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < strength
                ? STRENGTH_COLORS[strength]
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p
        className={`text-xs font-semibold ${STRENGTH_TEXT_COLORS[strength] || "text-slate-400 dark:text-slate-500"}`}
      >
        {STRENGTH_LABELS[strength] || ""}
      </p>

      {/* Requirements list */}
      <ul className="space-y-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.label}
              className={`text-[11px] flex items-center gap-1.5 font-medium ${met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${met ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
              />
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

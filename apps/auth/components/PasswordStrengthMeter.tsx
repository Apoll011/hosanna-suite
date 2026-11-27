// SPDX-License-Identifier: AGPL-3.0-only
"use client";

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

const STRENGTH_LABELS = ["", "Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
const STRENGTH_COLORS = [
  "",
  "bg-m3-danger",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-m3-success",
];
const STRENGTH_TEXT_COLORS = [
  "",
  "text-m3-danger",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-m3-success",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getStrength(password);

  return (
    <div className="space-y-2 px-1 animate-in fade-in duration-200" aria-live="polite">
      <div
        className="flex gap-1.5 h-1.5"
        aria-label={`Password strength: ${strength} of ${REQUIREMENTS.length}`}
      >
        {REQUIREMENTS.map((_, i) => (
          <div key={i} className="flex-1 overflow-hidden rounded-full bg-m3-border/70">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-300 ${i < strength ? STRENGTH_COLORS[strength] : "w-0"}`}
              style={{ width: i < strength ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      <p
        className={`text-xs font-semibold ${STRENGTH_TEXT_COLORS[strength] || "text-slate-400 dark:text-slate-500"}`}
      >
        {STRENGTH_LABELS[strength] || ""}
      </p>

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

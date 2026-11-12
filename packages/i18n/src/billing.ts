import { sharedMessages } from "./messages";
import type { Language } from "./types";

/** Stable billing period ids returned by GET /api/billing/pricing. */
export type PlanPeriodId = "month" | "year";

const FALLBACK: Record<PlanPeriodId, string> = {
  month: "/mo",
  year: "/yr",
};

/** Map a period id from the pricing API to a localized suffix (e.g. "/mês"). */
export function billingPeriodLabel(
  period: string | null | undefined,
  language: Language = "en",
): string {
  const id: PlanPeriodId = period === "year" ? "year" : "month";
  const dict = sharedMessages[language] ?? sharedMessages.en;
  return dict.billing?.period?.[id] ?? FALLBACK[id];
}

export function isPlanPeriodId(value: unknown): value is PlanPeriodId {
  return value === "month" || value === "year";
}

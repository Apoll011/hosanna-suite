import { get } from "@vercel/global-config";

/** Stable period ids — clients map these through shared i18n (`billing.period.*`). */
export type PlanPeriodId = "month" | "year";

export type PlanPriceTier = {
  amountCents: number;
  amountDisplay: string;
  period: PlanPeriodId;
};

export type PlanPricing = {
  plan: "cloud";
  currency: string;
  monthly: PlanPriceTier;
  annual: PlanPriceTier;
};

/**
 * Fallback when Global Config is missing / unreachable.
 * Keep in sync with the `hosanna-cloud` Global Config item in the Vercel dashboard.
 */
export const DEFAULT_PLAN_PRICING: PlanPricing = {
  plan: "cloud",
  currency: "eur",
  monthly: {
    amountCents: 1200,
    amountDisplay: "€12",
    period: "month",
  },
  annual: {
    amountCents: 12000,
    amountDisplay: "€120",
    period: "year",
  },
};

type GlobalCloudPricing = {
  plan?: string;
  currency?: string;
  monthly?: {
    amountCents?: number;
    amountDisplay?: string;
    period?: string;
  };
  annual?: {
    amountCents?: number;
    amountDisplay?: string;
    period?: string;
  };
};

function asPeriodId(value: unknown, fallback: PlanPeriodId): PlanPeriodId {
  if (value === "month" || value === "year") return value;
  // Tolerate older/misconfigured labels.
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v.includes("month") || v === "mo" || v === "/mo" || v === "/mês") return "month";
    if (v.includes("year") || v.includes("ano") || v === "yr" || v === "/yr" || v === "/ano") {
      return "year";
    }
  }
  return fallback;
}

function normalizePricing(raw: unknown): PlanPricing {
  if (!raw || typeof raw !== "object") return DEFAULT_PLAN_PRICING;
  const data = raw as GlobalCloudPricing;

  const monthlyCents =
    typeof data.monthly?.amountCents === "number"
      ? data.monthly.amountCents
      : DEFAULT_PLAN_PRICING.monthly.amountCents;
  const annualCents =
    typeof data.annual?.amountCents === "number"
      ? data.annual.amountCents
      : DEFAULT_PLAN_PRICING.annual.amountCents;

  return {
    plan: "cloud",
    currency:
      typeof data.currency === "string" && data.currency
        ? data.currency
        : DEFAULT_PLAN_PRICING.currency,
    monthly: {
      amountCents: monthlyCents,
      amountDisplay:
        typeof data.monthly?.amountDisplay === "string" && data.monthly.amountDisplay
          ? data.monthly.amountDisplay
          : DEFAULT_PLAN_PRICING.monthly.amountDisplay,
      period: asPeriodId(data.monthly?.period, "month"),
    },
    annual: {
      amountCents: annualCents,
      amountDisplay:
        typeof data.annual?.amountDisplay === "string" && data.annual.amountDisplay
          ? data.annual.amountDisplay
          : DEFAULT_PLAN_PRICING.annual.amountDisplay,
      period: asPeriodId(data.annual?.period, "year"),
    },
  };
}

/**
 * Read plan display pricing from Vercel Global Config key `hosanna-cloud`.
 * Requires `GLOBAL_CONFIG` (or legacy `EDGE_CONFIG`) connection string on auth.
 */
export async function getPlanPricing(): Promise<PlanPricing> {
  try {
    const value = await get<GlobalCloudPricing>("hosanna-cloud");
    return normalizePricing(value);
  } catch (err) {
    console.error("[billing] Failed to read hosanna-cloud from Global Config:", err);
    return DEFAULT_PLAN_PRICING;
  }
}

/** Public API payload for GET /api/billing/pricing. */
export async function pricingResponse() {
  const pricing = await getPlanPricing();
  return {
    plan: pricing.plan,
    currency: pricing.currency,
    monthly: {
      amount: pricing.monthly.amountDisplay,
      amountCents: pricing.monthly.amountCents,
      period: pricing.monthly.period,
    },
    annual: {
      amount: pricing.annual.amountDisplay,
      amountCents: pricing.annual.amountCents,
      period: pricing.annual.period,
    },
  };
}

import { env } from "@/lib/config/env";

export const PLAN_PRICING = {
  monthly: {
    amountCents: env.planPriceMonthlyCents,
    amountDisplay: env.planPriceMonthlyDisplay,
    period: env.planPriceMonthlyPeriod,
  },
  annual: {
    amountCents: env.planPriceAnnualCents,
    amountDisplay: env.planPriceAnnualDisplay,
    period: env.planPriceAnnualPeriod,
  },
  currency: env.planPriceCurrency,
  plan: "cloud" as const,
} as const;

export function pricingResponse() {
  return {
    plan: PLAN_PRICING.plan,
    currency: PLAN_PRICING.currency,
    monthly: {
      amount: PLAN_PRICING.monthly.amountDisplay,
      amountCents: PLAN_PRICING.monthly.amountCents,
      period: PLAN_PRICING.monthly.period,
    },
    annual: {
      amount: PLAN_PRICING.annual.amountDisplay,
      amountCents: PLAN_PRICING.annual.amountCents,
      period: PLAN_PRICING.annual.period,
    },
  };
}

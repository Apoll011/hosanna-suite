/**
 * Canonical display prices for the org "cloud" plan.
 * Stripe price IDs are configured on the auth app; amounts here are for UI only.
 *
 * Override via env without a redeploy of frontends that fetch /api/billing/pricing.
 */
export const PLAN_PRICING = {
  monthly: {
    amountCents: parseInt(process.env.PLAN_PRICE_MONTHLY_CENTS ?? "1200", 10),
    amountDisplay: process.env.PLAN_PRICE_MONTHLY_DISPLAY ?? "€12",
    period: process.env.PLAN_PRICE_MONTHLY_PERIOD ?? "/mês",
  },
  annual: {
    amountCents: parseInt(process.env.PLAN_PRICE_ANNUAL_CENTS ?? "12000", 10),
    amountDisplay: process.env.PLAN_PRICE_ANNUAL_DISPLAY ?? "€120",
    period: process.env.PLAN_PRICE_ANNUAL_PERIOD ?? "/ano",
  },
  currency: process.env.PLAN_PRICE_CURRENCY ?? "eur",
  plan: "cloud" as const,
} as const;

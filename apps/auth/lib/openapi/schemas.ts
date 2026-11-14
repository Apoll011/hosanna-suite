import { z } from "zod";

export const PlanPricingSchema = z
  .object({
    plan: z.enum(["cloud"]).describe("Plan tier identifier"),
    currency: z.string().describe("Three-letter ISO currency code"),
    monthly: z
      .object({
        amount: z.string().describe("Formatted monthly amount"),
        amountCents: z.number().int().describe("Monthly price in cents"),
        period: z
          .enum(["month", "year"])
          .describe("Stable period id; clients localize via billing.period.*"),
      })
      .describe("Monthly billing option"),
    annual: z
      .object({
        amount: z.string().describe("Formatted annual amount"),
        amountCents: z.number().int().describe("Annual price in cents"),
        period: z
          .enum(["month", "year"])
          .describe("Stable period id; clients localize via billing.period.*"),
      })
      .describe("Annual billing option"),
  })
  .describe("Public subscription plan pricing tiers");

export const BackupDocumentSchema = z
  .object({
    version: z.string().describe("Backup schema version (e.g., 2.2)"),
    exportedAt: z.string().datetime().describe("Export ISO timestamp"),
    folders: z.array(z.record(z.string(), z.any())).describe("Exported folder documents"),
    songs: z.array(z.record(z.string(), z.any())).describe("Exported song documents"),
    services: z.array(z.record(z.string(), z.any())).describe("Exported service orders"),
    collections: z
      .array(z.record(z.string(), z.any()))
      .optional()
      .describe("Exported song collections"),
    agendaEvents: z
      .array(z.record(z.string(), z.any()))
      .optional()
      .describe("Exported calendar agenda events"),
  })
  .describe("Full organization data archive for backup and restore");

export function getAuthComponentSchemas(): Record<string, Record<string, unknown>> {
  function clean(json: any) {
    const copy = { ...json };
    delete copy["$schema"];
    return copy;
  }

  return {
    PlanPricing: clean(z.toJSONSchema(PlanPricingSchema)),
    BackupDocument: clean(z.toJSONSchema(BackupDocumentSchema)),
  };
}

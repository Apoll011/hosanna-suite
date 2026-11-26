// SPDX-License-Identifier: AGPL-3.0-only
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required").default("Culto Dominical"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required").default("10:00"),
  durationMinutes: z.number().int().min(15).default(90),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  color: z.enum(["blue", "green", "red", "yellow", "purple", "orange", "gray"]).default("blue"),
});

export type TEventFormData = z.infer<typeof eventSchema>;

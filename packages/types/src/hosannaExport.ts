// SPDX-License-Identifier: AGPL-3.0-only
import { z } from "zod";

export const HOSANNA_EXPORT_FORMAT = "hosanna-export" as const;
export const HOSANNA_EXPORT_CURRENT_VERSION = 1 as const;
export const HOSANNA_EXPORT_MAX_BYTES = 25 * 1024 * 1024;

export const HosannaExportSourceSchema = z.object({
  orgId: z.string().min(1).optional(),
  app: z.string().min(1),
});

export const HosannaExportFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  parentId: z.string().nullable().optional().default(null),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const HosannaExportSongSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  artist: z.string().optional().default(""),
  folderId: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
  content: z.string(),
  song_number: z.number().int().nullable().optional(),
  updatedAt: z.string().optional(),
});

export const HosannaExportCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  songIds: z.array(z.string()).optional().default([]),
});

export const HosannaExportV1Schema = z.object({
  format: z.literal(HOSANNA_EXPORT_FORMAT),
  version: z.literal(HOSANNA_EXPORT_CURRENT_VERSION),
  exportedAt: z.string().min(1),
  source: HosannaExportSourceSchema.optional(),
  folders: z.array(HosannaExportFolderSchema).default([]),
  songs: z.array(HosannaExportSongSchema).default([]),
  collections: z.array(HosannaExportCollectionSchema).default([]),
});

export type HosannaExportSource = z.infer<typeof HosannaExportSourceSchema>;
export type HosannaExportFolder = z.infer<typeof HosannaExportFolderSchema>;
export type HosannaExportSong = z.infer<typeof HosannaExportSongSchema>;
export type HosannaExportCollection = z.infer<typeof HosannaExportCollectionSchema>;
export type HosannaExportDocument = z.infer<typeof HosannaExportV1Schema>;

export type HosannaExportParseErrorCode =
  | "file_too_large"
  | "malformed_json"
  | "invalid_format"
  | "unsupported_version"
  | "invalid_schema";

export type HosannaExportParseResult =
  | { ok: true; data: HosannaExportDocument }
  | {
      ok: false;
      code: HosannaExportParseErrorCode;
      message: string;
      foundVersion?: unknown;
    };

export function parseHosannaExport(raw: unknown): HosannaExportParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      code: "invalid_format",
      message: "Expected a JSON object with format \"hosanna-export\".",
    };
  }

  const record = raw as Record<string, unknown>;
  if (record.format !== HOSANNA_EXPORT_FORMAT) {
    return {
      ok: false,
      code: "invalid_format",
      message: "Not a valid Hosanna export file (missing or invalid format).",
    };
  }

  if (record.version !== HOSANNA_EXPORT_CURRENT_VERSION) {
    return {
      ok: false,
      code: "unsupported_version",
      foundVersion: record.version,
      message: `Unsupported export version (${String(record.version)}). Supported version: ${HOSANNA_EXPORT_CURRENT_VERSION}.`,
    };
  }

  const parsed = HosannaExportV1Schema.safeParse(record);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return {
      ok: false,
      code: "invalid_schema",
      message: issue ? `${path}${issue.message}` : "Invalid Hosanna export schema.",
    };
  }

  return { ok: true, data: parsed.data };
}

export function parseHosannaExportJson(
  text: string,
  byteLength?: number,
): HosannaExportParseResult {
  const size = byteLength ?? new TextEncoder().encode(text).byteLength;
  if (size > HOSANNA_EXPORT_MAX_BYTES) {
    return {
      ok: false,
      code: "file_too_large",
      message: `Export file exceeds the ${Math.round(HOSANNA_EXPORT_MAX_BYTES / (1024 * 1024))} MB limit.`,
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ok: false,
      code: "malformed_json",
      message: "The selected file is not valid JSON.",
    };
  }

  return parseHosannaExport(raw);
}

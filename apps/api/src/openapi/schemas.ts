// SPDX-License-Identifier: AGPL-3.0-only
import { z } from "zod";
import { cleanJsonSchema } from "./builder.js";

export const ErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().describe("Machine-readable error code"),
        message: z.string().describe("Human-readable error message"),
        details: z.any().optional().describe("Additional structured error context"),
      })
      .describe("Error payload details"),
  })
  .describe("Standard Hosanna API error envelope");

export const CheckpointSchema = z
  .object({
    updatedAt: z.number().int().describe("Unix epoch timestamp in milliseconds"),
    id: z.string().describe("Document unique identifier"),
  })
  .nullable()
  .describe("Replication checkpoint cursor");

export const SongSchema = z
  .object({
    id: z.string().uuid().describe("Unique song UUID"),
    orgId: z.string().describe("Organization ID owning the song"),
    title: z.string().describe("Song title"),
    artist: z.string().optional().describe("Artist or songwriter"),
    content: z.string().optional().describe("ChordPro song lyrics and chords"),
    folderId: z.string().uuid().nullable().optional().describe("Parent folder ID, null for root"),
    path: z.string().optional().describe("Full path in folder tree"),
    tags: z.array(z.string()).default([]).describe("Song tags / categories"),
    song_number: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe("Catalog or hymnal number"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
    deleted: z.boolean().default(false).describe("Soft-deleted flag"),
    purgeAt: z.string().datetime().nullable().optional().describe("Trash retention purge deadline"),
    collectionIds: z.array(z.string().uuid()).default([]).describe("Associated collection UUIDs"),
    isDeleted: z.boolean().default(false).describe("Replication sync tombstone alias"),
  })
  .describe("Song document with ChordPro lyrics and metadata");

export const FolderSchema = z
  .object({
    id: z.string().uuid().describe("Unique folder UUID"),
    orgId: z.string().describe("Organization ID owning the folder"),
    name: z.string().describe("Folder display name"),
    color: z.string().optional().describe("Hex color code or theme color identifier"),
    icon: z.string().optional().describe("Icon identifier"),
    parentId: z.string().uuid().nullable().optional().describe("Parent folder UUID, null for root"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
    deleted: z.boolean().default(false).describe("Soft-deleted flag"),
    purgeAt: z.string().datetime().nullable().optional().describe("Trash retention purge deadline"),
    songCount: z.number().int().default(0).describe("Count of direct child songs"),
    folderCount: z.number().int().default(0).describe("Count of direct child folders"),
    isDeleted: z.boolean().default(false).describe("Replication sync tombstone alias"),
  })
  .describe("Folder document for hierarchical song organization");

export const ServiceElementSchema = z
  .object({
    id: z.string().optional().describe("Element unique identifier"),
    type: z
      .enum(["welcome", "scripture", "message", "announcement", "custom", "song"])
      .optional()
      .describe("Service element type"),
    title: z.string().optional().describe("Element title"),
    content: z.string().nullable().optional().describe("Element body or scripture text"),
    position: z.number().int().optional().describe("Order position in the service"),
    songId: z.string().nullable().optional().describe("Associated song UUID when type is song"),
    notes: z.string().nullable().optional().describe("Worship leader / musician notes"),
    passage: z.string().nullable().optional().describe("Scripture reference passage"),
    duration: z.number().int().nullable().optional().describe("Estimated duration in seconds"),
  })
  .passthrough()
  .describe("Individual item within a worship service order");

export const ServiceSchema = z
  .object({
    id: z.string().uuid().describe("Unique service UUID"),
    name: z.string().describe("Service name or theme"),
    date: z.string().datetime().describe("Scheduled service date and time"),
    notes: z.string().nullable().optional().describe("General notes for musicians and tech team"),
    elements: z
      .array(ServiceElementSchema)
      .default([])
      .describe("Ordered list of service elements"),
    archived: z.boolean().default(false).describe("Archived service flag"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
    isDeleted: z.boolean().default(false).describe("Replication sync tombstone alias"),
    purgeAt: z.string().datetime().nullable().optional().describe("Trash retention purge deadline"),
  })
  .describe("Worship service order of service document");

export const ServiceNoteSchema = z
  .object({
    id: z.string().uuid().describe("Unique note UUID"),
    orgId: z.string().describe("Owning organization ID"),
    serviceId: z.string().uuid().describe("Parent service UUID"),
    title: z.string().describe("Note title"),
    content: z.string().describe("Note content"),
    type: z.string().optional().describe("Note category or role target"),
    position: z.number().int().optional().describe("Ordering position"),
    isDeleted: z.boolean().default(false).describe("Replication tombstone flag"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
  })
  .describe("Collaborative note attached to a service");

export const CollectionSchema = z
  .object({
    id: z.string().uuid().describe("Collection unique UUID"),
    orgId: z.string().describe("Owning organization ID"),
    name: z.string().describe("Collection name"),
    color: z.string().optional().describe("Collection color code"),
    icon: z.string().optional().describe("Collection icon"),
    songCount: z.number().int().default(0).describe("Number of songs in this collection"),
    isDeleted: z.boolean().default(false).describe("Replication tombstone flag"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
  })
  .describe("Custom song collection / tag grouping");

export const AgendaEventSchema = z
  .object({
    id: z.string().uuid().describe("Event unique UUID"),
    orgId: z.string().describe("Owning organization ID"),
    title: z.string().describe("Event title"),
    date: z.string().datetime().describe("Event start date/time (ISO 8601)"),
    notes: z.string().nullable().optional().describe("Event notes"),
    color: z.string().nullable().optional().describe("Event color theme"),
    isDeleted: z.boolean().default(false).describe("Replication tombstone flag"),
    createdAt: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
    updatedAt: z.string().datetime().describe("Last updated timestamp (ISO 8601)"),
  })
  .describe("Agenda calendar event for ministry teams");

export const ReplicationCollectionSchema = z
  .enum(["songs", "folders", "services", "collections", "service_notes", "agenda_events"])
  .describe("Supported replication collection name");

export const PullRequestSchema = z
  .object({
    checkpoint: z
      .record(z.string(), z.any())
      .nullable()
      .optional()
      .describe("Current client checkpoint per collection"),
    limit: z.number().int().default(100).describe("Maximum changes to pull"),
  })
  .describe("Multi-collection pull request payload");

export const PullResponseSchema = z
  .object({
    checkpoint: z
      .record(z.string(), z.any())
      .nullable()
      .optional()
      .describe("New checkpoint state per collection"),
    documents: z.array(z.record(z.string(), z.any())).describe("List of changed documents"),
    hasMore: z.boolean().describe("Whether more changes remain to be pulled"),
  })
  .describe("Replication pull response payload");

export const ChangeRowSchema = z
  .object({
    newDocumentState: z
      .record(z.string(), z.any())
      .describe("New document state submitted by client"),
    assumedMasterState: z
      .record(z.string(), z.any())
      .nullable()
      .optional()
      .describe("Client baseline state for three-way merge"),
  })
  .describe("Single document mutation row for replication push");

export const AnnotationGetResponseSchema = z
  .object({
    canvasDataBase64: z.string().describe("Base64-encoded canvas stroke drawing data"),
    updatedAt: z.string().datetime().describe("Last modified timestamp"),
    updatedById: z.string().nullable().optional().describe("User ID who last updated annotations"),
    revision: z.number().int().describe("Monotonically increasing annotation revision"),
  })
  .describe("Sheet music stroke annotations for a song in a service");

const SongImportStepSchema = z.object({
  id: z.string().describe("Step identifier"),
  label: z.string().describe("Human-readable step label"),
  done: z.boolean().describe("Whether step completed successfully"),
  active: z.boolean().describe("Whether step is currently executing"),
});

const SongImportDiagnosticSchema = z.object({
  severity: z.string().describe("Diagnostic severity (error/warning)"),
  message: z.string().describe("Diagnostic message"),
  line: z.number().int().optional().describe("One-based source line when applicable"),
});

const SongImportDuplicateSchema = z.object({
  id: z.string().describe("Existing song UUID"),
  title: z.string().describe("Existing song title"),
  artist: z.string().describe("Existing song artist"),
  score: z.number().describe("Similarity score 0-1"),
});

const SongImportDraftSchema = z.object({
  title: z.string().describe("Extracted song title"),
  artist: z.string().describe("Extracted artist or songwriter"),
  content: z.string().describe("Extracted ChordPro content"),
  key: z.string().optional().describe("Detected musical key"),
  tempo: z.string().optional().describe("Detected tempo marking or BPM"),
  timeSignature: z.string().optional().describe("Detected time signature"),
  confidence: z.number().min(0).max(1).optional().describe("Extraction confidence 0-1"),
  warnings: z.array(z.string()).describe("Human-readable warnings"),
  diagnostics: z.array(SongImportDiagnosticSchema).optional().describe("ChordPro diagnostics"),
  possibleDuplicates: z.array(SongImportDuplicateSchema).optional().describe("Possible duplicates"),
  youtube: z.string().optional().describe("YouTube watch URL"),
  ccli: z.string().optional().describe("CCLI song number"),
  composer: z.string().optional().describe("Composer / writers"),
  copyright: z.string().optional().describe("Copyright / publisher line"),
  subtitle: z.string().optional().describe("Subtitle or alternate title"),
  duration: z.string().optional().describe("Song duration"),
});

export const SongImportJobSchema = z
  .object({
    id: z.string().uuid().describe("Import job UUID"),
    status: z
      .enum(["queued", "running", "completed", "failed", "cancelled"])
      .describe("Job execution status"),
    steps: z.array(SongImportStepSchema).describe("Progress breakdown of the import pipeline"),
    result: SongImportDraftSchema.optional().describe("Extracted result when status is completed"),
    errorMessage: z.string().optional().describe("Failure message when status is failed"),
    cancelCode: z
      .enum(["not_a_song", "unreadable", "blank", "wrong_content", "multiple_unclear"])
      .optional()
      .describe("AI pipeline rejection reason"),
    cancelReason: z.string().optional().describe("Reason if cancelled"),
    cancelledBy: z.enum(["ai", "user"]).optional().describe("Who cancelled the job"),
  })
  .describe("Asynchronous AI-powered song sheet/PDF import job");

export function getApiComponentSchemas(): Record<string, Record<string, unknown>> {
  return {
    Error: cleanJsonSchema(z.toJSONSchema(ErrorSchema)),
    Checkpoint: cleanJsonSchema(z.toJSONSchema(CheckpointSchema)),
    Song: cleanJsonSchema(z.toJSONSchema(SongSchema)),
    Folder: cleanJsonSchema(z.toJSONSchema(FolderSchema)),
    ServiceElement: cleanJsonSchema(z.toJSONSchema(ServiceElementSchema)),
    Service: cleanJsonSchema(z.toJSONSchema(ServiceSchema)),
    ServiceNote: cleanJsonSchema(z.toJSONSchema(ServiceNoteSchema)),
    Collection: cleanJsonSchema(z.toJSONSchema(CollectionSchema)),
    AgendaEvent: cleanJsonSchema(z.toJSONSchema(AgendaEventSchema)),
    ReplicationCollection: cleanJsonSchema(z.toJSONSchema(ReplicationCollectionSchema)),
    PullRequest: cleanJsonSchema(z.toJSONSchema(PullRequestSchema)),
    PullResponse: cleanJsonSchema(z.toJSONSchema(PullResponseSchema)),
    ChangeRow: cleanJsonSchema(z.toJSONSchema(ChangeRowSchema)),
    AnnotationGetResponse: cleanJsonSchema(z.toJSONSchema(AnnotationGetResponseSchema)),
    SongImportJob: cleanJsonSchema(z.toJSONSchema(SongImportJobSchema)),
  };
}

import type { McpContext } from "../context.js";

export type ResourceKind = "song" | "service" | "folder";

export type CanonicalErrorCode =
  | "NOT_FOUND"
  | "TRASHED"
  | "FORBIDDEN"
  | "STALE"
  | "INVALID"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "PERMISSION_DENIED"
  | "SUBSCRIPTION_REQUIRED"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

/** Thrown when a library resource is missing or soft-deleted (trash). */
export class ResourceAccessError extends Error {
  readonly canonicalCode: CanonicalErrorCode;
  readonly details: {
    id: string;
    kind: ResourceKind;
    purgeAt?: string | null;
  };

  constructor(
    canonicalCode: "NOT_FOUND" | "TRASHED",
    message: string,
    details: { id: string; kind: ResourceKind; purgeAt?: string | null },
  ) {
    super(message);
    this.name = "ResourceAccessError";
    this.canonicalCode = canonicalCode;
    this.details = details;
  }
}

export type LoadResourceOptions = {
  /** When true, return soft-deleted rows instead of TRASHED. */
  includeTrashed?: boolean;
};

function trashedHint(kind: ResourceKind, id: string): string {
  return `This ${kind} is in the trash. Call ${kind}s_restore with id=${id}, or retry with includeTrashed=true for a read-only view.`;
}

export async function loadSong(
  ctx: McpContext,
  songId: string,
  opts?: LoadResourceOptions,
) {
  const song = await ctx.db.song.findFirst({ where: { id: songId } });
  if (!song) {
    throw new ResourceAccessError("NOT_FOUND", "A música não existe.", {
      id: songId,
      kind: "song",
    });
  }
  if (song.deleted && !opts?.includeTrashed) {
    throw new ResourceAccessError("TRASHED", "A música está na lixeira.", {
      id: songId,
      kind: "song",
      purgeAt: song.purgeAt?.toISOString() ?? null,
    });
  }
  return song;
}

export async function loadService(
  ctx: McpContext,
  serviceId: string,
  opts?: LoadResourceOptions,
) {
  const service = await ctx.db.service.findFirst({ where: { id: serviceId } });
  if (!service) {
    throw new ResourceAccessError("NOT_FOUND", "O culto não existe.", {
      id: serviceId,
      kind: "service",
    });
  }
  if (service.deleted && !opts?.includeTrashed) {
    throw new ResourceAccessError("TRASHED", "O culto está na lixeira.", {
      id: serviceId,
      kind: "service",
      purgeAt: service.purgeAt?.toISOString() ?? null,
    });
  }
  return service;
}

export function resourceAccessHint(err: ResourceAccessError): string {
  if (err.canonicalCode === "TRASHED") {
    return trashedHint(err.details.kind, err.details.id);
  }
  return `No ${err.details.kind} with id=${err.details.id} in this organization.`;
}

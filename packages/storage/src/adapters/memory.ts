import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { StorageError, StorageNotFoundError } from "../types.js";
import type { ListInput, ListResult, MultipartPart, MultipartUpload, ObjectBody, ObjectMetadata, ObjectStorage, PresignedUrl, TenantObjectStorage, UploadInput, UrlOptions } from "../types.js";

type Entry = { bytes: Uint8Array; metadata: ObjectMetadata };
type PendingUpload = { tenant: string; key: string; contentType?: string; metadata: Record<string, string>; parts: Map<number, Uint8Array> };

export function createMemoryStorage(): ObjectStorage {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, PendingUpload>();
  const objectKey = (tenant: string, key: string) => `${tenant}/${cleanKey(key)}`;
  const tenantApi = (tenant: string): TenantObjectStorage => {
    const scoped = (key: string) => objectKey(tenant, key);
    const get = (key: string) => {
      const entry = entries.get(scoped(key));
      if (!entry) throw new StorageNotFoundError(key);
      return entry;
    };
    const store = (key: string, bytes: Uint8Array, contentType?: string, metadata: Record<string, string> = {}) => {
      const value: ObjectMetadata = { key, size: bytes.byteLength, metadata: { ...metadata }, ...(contentType ? { contentType } : {}), lastModified: new Date() };
      entries.set(scoped(key), { bytes: bytes.slice(), metadata: value });
      return value;
    };
    return {
      async upload(input) { return store(input.key, await bodyBytes(input.body), input.contentType, input.metadata); },
      async download(key) { return new Blob([get(key).bytes]).stream(); },
      async downloadNode(key) { return Readable.from(get(key).bytes); },
      async delete(key) { entries.delete(scoped(key)); },
      async deleteMany(keys) { keys.forEach((key) => entries.delete(scoped(key))); },
      async exists(key) { return entries.has(scoped(key)); },
      async head(key) { return entries.get(scoped(key))?.metadata ?? null; },
      async list(input: ListInput = {}): Promise<ListResult> {
        const prefix = `${tenant}/${input.prefix ? `${cleanKey(input.prefix).replace(/\/$/, "")}/` : ""}`;
        const all = [...entries.entries()].filter(([key]) => key.startsWith(prefix)).sort(([a], [b]) => a.localeCompare(b));
        const after = input.cursor ? all.findIndex(([key]) => key === input.cursor) + 1 : 0;
        const limit = input.limit ?? 1000;
        const page = all.slice(after, after + limit);
        return { objects: page.map(([, entry]) => ({ ...entry.metadata, metadata: { ...entry.metadata.metadata } })), ...(after + limit < all.length && page.length ? { nextCursor: page.at(-1)?.[0] } : {}) };
      },
      async copy(sourceKey, destinationKey) { const entry = get(sourceKey); return store(destinationKey, entry.bytes, entry.metadata.contentType, entry.metadata.metadata); },
      async createUploadUrl(key, options) { return memoryUrl("upload", scoped(key), "PUT", options); },
      async createDownloadUrl(key, options) { get(key); return memoryUrl("download", scoped(key), "GET", options); },
      async createMultipartUpload(input) {
        const uploadId = crypto.randomUUID();
        pending.set(uploadId, { tenant, key: input.key, ...(input.contentType ? { contentType: input.contentType } : {}), metadata: input.metadata ?? {}, parts: new Map() });
        return { uploadId, key: input.key };
      },
      async uploadMultipartPart(upload, partNumber, body: ObjectBody) {
        const active = pending.get(upload.uploadId);
        if (!active || active.tenant !== tenant || active.key !== upload.key) throw new StorageError("UPLOAD_NOT_FOUND", "Multipart upload not found");
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new StorageError("INVALID_INPUT", "Part number must be between 1 and 10000");
        const bytes = await bodyBytes(body);
        active.parts.set(partNumber, bytes);
        return { partNumber, etag: await digest(bytes) };
      },
      async createMultipartPartUrl(upload, partNumber) {
        const active = pending.get(upload.uploadId);
        if (!active || active.tenant !== tenant || active.key !== upload.key) throw new StorageError("UPLOAD_NOT_FOUND", "Multipart upload not found");
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new StorageError("INVALID_INPUT", "Part number must be between 1 and 10000");
        return { url: `memory://multipart/${upload.uploadId}/${partNumber}`, method: "PUT", headers: {}, expiresAt: new Date(Date.now() + 900_000) };
      },
      async completeMultipartUpload(upload, parts: MultipartPart[]) {
        const active = pending.get(upload.uploadId);
        if (!active || active.tenant !== tenant || active.key !== upload.key) throw new StorageError("UPLOAD_NOT_FOUND", "Multipart upload not found");
        const data = [...parts].sort((a, b) => a.partNumber - b.partNumber).map((part) => active.parts.get(part.partNumber));
        if (data.some((part) => !part)) throw new StorageError("INVALID_INPUT", "Multipart part is missing");
        const merged = concatenate(data as Uint8Array[]);
        pending.delete(upload.uploadId);
        return store(upload.key, merged, active.contentType, active.metadata);
      },
      async abortMultipartUpload(upload) { pending.delete(upload.uploadId); },
    };
  };
  return { forTenant(tenantId) { validateTenant(tenantId); return tenantApi(tenantId); } };
}

async function bodyBytes(body: UploadInput["body"]): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body;
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
  if (body instanceof Readable) {
    const parts: Uint8Array[] = [];
    for await (const chunk of body) parts.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
    return concatenate(parts);
  }
  return new Uint8Array(await new Response(body).arrayBuffer());
}

function concatenate(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.byteLength; }
  return result;
}

function validateTenant(tenant: string) {
  if (!tenant.trim() || tenant.includes("/") || tenant === "." || tenant === "..") throw new StorageError("INVALID_INPUT", "Tenant id must be a non-empty path segment");
}

function cleanKey(key: string) {
  const normalized = key.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.split("/").some((part) => part === ".." || part === ".") || normalized.includes("\0")) throw new StorageError("INVALID_INPUT", "Object key must be a non-empty relative path");
  return normalized;
}

function memoryUrl(operation: string, key: string, method: "GET" | "PUT", options?: UrlOptions): PresignedUrl {
  const expiresInSeconds = options?.expiresInSeconds ?? 900;
  return { url: `memory://${operation}/${encodeURIComponent(key)}?expires=${expiresInSeconds}`, method, headers: { ...(options?.contentType ? { "content-type": options.contentType } : {}), ...(options?.contentDisposition ? { "content-disposition": options.contentDisposition } : {}) }, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
}

async function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

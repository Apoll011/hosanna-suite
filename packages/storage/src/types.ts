import type { Readable } from "node:stream";

export type ObjectBody = Uint8Array | Blob | ReadableStream<Uint8Array> | Readable;

export type UploadInput = {
  key: string;
  body: ObjectBody;
  contentType?: string;
  metadata?: Record<string, string>;
};

export type StoredObject = ObjectMetadata;

export type ObjectMetadata = {
  key: string;
  size: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
  metadata: Record<string, string>;
};

export type ListInput = {
  prefix?: string;
  cursor?: string;
  limit?: number;
};

export type ListResult = {
  objects: ObjectMetadata[];
  nextCursor?: string;
};

export type UrlOptions = {
  expiresInSeconds?: number;
  contentType?: string;
  contentDisposition?: string;
  maxSizeBytes?: number;
};

export type PresignedUrl = {
  url: string;
  method: "GET" | "PUT" | "POST";
  headers: Record<string, string>;
  fields?: Record<string, string>;
  expiresAt: Date;
};

export type MultipartUpload = {
  uploadId: string;
  key: string;
};

export type MultipartPart = {
  partNumber: number;
  etag: string;
};

export type MultipartPartUrlOptions = {
  expiresInSeconds?: number;
};

export interface TenantObjectStorage {
  upload(input: UploadInput): Promise<StoredObject>;
  download(key: string): Promise<ReadableStream<Uint8Array>>;
  downloadNode(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
  head(key: string): Promise<ObjectMetadata | null>;
  list(input?: ListInput): Promise<ListResult>;
  copy(sourceKey: string, destinationKey: string): Promise<StoredObject>;
  createUploadUrl(key: string, options?: UrlOptions): Promise<PresignedUrl>;
  createDownloadUrl(key: string, options?: UrlOptions): Promise<PresignedUrl>;
  createMultipartUpload(input: Omit<UploadInput, "body">): Promise<MultipartUpload>;
  uploadMultipartPart(upload: MultipartUpload, partNumber: number, body: ObjectBody): Promise<MultipartPart>;
  createMultipartPartUrl(upload: MultipartUpload, partNumber: number, options?: MultipartPartUrlOptions): Promise<PresignedUrl>;
  completeMultipartUpload(upload: MultipartUpload, parts: MultipartPart[]): Promise<StoredObject>;
  abortMultipartUpload(upload: MultipartUpload): Promise<void>;
}

export interface ObjectStorage {
  forTenant(tenantId: string): TenantObjectStorage;
}

export type StorageErrorCode = "NOT_FOUND" | "ACCESS_DENIED" | "INVALID_INPUT" | "PROVIDER_ERROR" | "UPLOAD_NOT_FOUND";

export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly cause: unknown;

  constructor(code: StorageErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "StorageError";
    this.code = code;
    this.cause = cause;
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(key: string, cause?: unknown) {
    super("NOT_FOUND", `Object not found: ${key}`, cause);
    this.name = "StorageNotFoundError";
  }
}

export class StorageAccessDeniedError extends StorageError {
  constructor(message = "Storage access denied", cause?: unknown) {
    super("ACCESS_DENIED", message, cause);
    this.name = "StorageAccessDeniedError";
  }
}
